"use client";

/**
 * 导出/导入用户配置
 * 支持跨设备迁移和备份
 */

interface ExportData {
  version: 1;
  exportedAt: string;
  favorites: string[];
  language: string;
  apiConfigs: Record<string, unknown>;
  // Note: API keys are encrypted, so we export the encrypted form
}

/**
 * 导出所有用户配置为 JSON 字符串
 * 包含：收藏、语言偏好、API 配置（加密后的）
 */
export async function exportAllConfig(): Promise<string> {
  const favorites = localStorage.getItem("martech-favorites");
  const i18n = localStorage.getItem("martech-i18n");
  const apiConfig = localStorage.getItem("martech-api-config");
  const analysisHistory = localStorage.getItem("martech-analysis-history");

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    favorites: favorites ? JSON.parse(favorites)?.state?.favorites ?? [] : [],
    language: i18n ? JSON.parse(i18n)?.state?.lang ?? "zh" : "zh",
    apiConfigs: apiConfig ? JSON.parse(apiConfig) : {},
  };

  return JSON.stringify(data, null, 2);
}

/**
 * 导入用户配置
 * 返回成功导入的项目数
 */
export async function importAllConfig(jsonString: string): Promise<{
  success: boolean;
  imported: string[];
  errors: string[];
}> {
  const imported: string[] = [];
  const errors: string[] = [];

  try {
    const data = JSON.parse(jsonString);

    if (!data.version || data.version !== 1) {
      return { success: false, imported, errors: ["不支持的配置版本"] };
    }

    // Import favorites
    if (data.favorites && Array.isArray(data.favorites)) {
      const favStore = JSON.stringify({
        state: { favorites: data.favorites },
        version: 0,
      });
      localStorage.setItem("martech-favorites", favStore);
      imported.push("收藏夹");
    }

    // Import language
    if (data.language) {
      const i18nStore = JSON.stringify({
        state: { lang: data.language },
        version: 0,
      });
      localStorage.setItem("martech-i18n", i18nStore);
      imported.push("语言设置");
    }

    // Import API configs (encrypted form preserved)
    if (data.apiConfigs && typeof data.apiConfigs === "object") {
      localStorage.setItem("martech-api-config", JSON.stringify(data.apiConfigs));
      imported.push("API 配置");
    }

    return {
      success: true,
      imported,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      imported,
      errors: [`解析失败: ${err instanceof Error ? err.message : "未知错误"}`],
    };
  }
}

/**
 * 下载配置文件
 */
export function downloadConfigFile(jsonString: string, filename?: string) {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `martech-config-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 读取上传的配置文件
 */
export function readConfigFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file);
  });
}
