"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Lang = "zh" | "en";

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  "nav.home": { zh: "首页", en: "Home" },
  "nav.workspace": { zh: "工作台", en: "Workspace" },
  "nav.category": { zh: "分类", en: "Categories" },
  "nav.compare": { zh: "对比", en: "Compare" },
  "nav.settings": { zh: "设置", en: "Settings" },
  "nav.search": { zh: "搜索...", en: "Search..." },

  // Hero
  "hero.badge": { zh: "发现 31+ 开源项目，覆盖 9 大研究方向", en: "Discover 31+ open-source projects across 9 research areas" },
  "hero.subtitle": { zh: "市场营销开源项目发现平台", en: "Marketing Open-Source Project Discovery Platform" },
  "hero.typewriter.label": { zh: "专注", en: "Focus on" },
  "hero.search": { zh: "搜索项目、技术栈、场景...", en: "Search projects, tech stacks, scenarios..." },
  "hero.scroll": { zh: "向下探索", en: "Scroll to explore" },

  // Stats
  "stat.projects": { zh: "项目", en: "Projects" },
  "stat.categories": { zh: "分类", en: "Categories" },
  "stat.tools": { zh: "工具", en: "Tools" },
  "stat.stars": { zh: "Stars", en: "Stars" },

  // Categories
  "categories.title": { zh: "探索", en: "Explore" },
  "categories.subtitle": { zh: "大研究方向", en: " Research Areas" },
  "categories.desc": { zh: "从 AI 模拟调研到统计工具箱，覆盖市场营销与消费者行为研究的完整链路", en: "From AI simulated research to statistics toolkit, covering the complete marketing and consumer behavior research pipeline" },

  // Featured
  "featured.title": { zh: "精选推荐", en: "Featured" },
  "featured.desc": { zh: "社区认可度最高、功能最完善的开源项目，适合快速上手", en: "Top community-approved, feature-rich open-source projects for quick onboarding" },

  // Trending
  "trending.title": { zh: "热门排行", en: "Trending" },
  "trending.desc": { zh: "按 GitHub Stars 排名，社区最受欢迎的项目", en: "Ranked by GitHub Stars, most popular community projects" },

  // Workspace
  "workspace.title": { zh: "工作台", en: "Workspace" },
  "workspace.desc": { zh: "个开源项目的交互式工具，上传数据或输入内容直接开始分析", en: " interactive tools from open-source projects — upload data or input content to start analysis" },
  "workspace.api.configured": { zh: "API 已配置 — AI 工具可直接使用", en: "API configured — AI tools ready to use" },
  "workspace.api.missing": { zh: "未配置 API Key — 仅统计工具可用", en: "No API Key — only statistics tools available" },
  "workspace.guide.title": { zh: "研究流程指南", en: "Research Workflow Guide" },
  "workspace.status.usable": { zh: "可使用", en: "Ready" },
  "workspace.status.developing": { zh: "已上线", en: "Available" },

  // Guide steps
  "guide.step1": { zh: "数据准备", en: "Data Preparation" },
  "guide.step1.desc": { zh: "清洗数据、处理缺失值、反向题编码", en: "Clean data, handle missing values, reverse-code items" },
  "guide.step2": { zh: "探索性分析", en: "Exploratory Analysis" },
  "guide.step2.desc": { zh: "描述性统计、分布检验、相关矩阵", en: "Descriptive stats, distribution tests, correlation matrix" },
  "guide.step3": { zh: "信效度检验", en: "Reliability & Validity" },
  "guide.step3.desc": { zh: "Cronbach's α、项目分析、EFA/CFA", en: "Cronbach's α, item analysis, EFA/CFA" },
  "guide.step4": { zh: "假设检验", en: "Hypothesis Testing" },
  "guide.step4.desc": { zh: "t 检验、ANOVA、回归分析", en: "t-test, ANOVA, regression" },
  "guide.step5": { zh: "因果建模", en: "Causal Modeling" },
  "guide.step5.desc": { zh: "中介/调节效应、SEM、Uplift", en: "Mediation/moderation, SEM, Uplift" },
  "guide.step6": { zh: "结果导出", en: "Export Results" },
  "guide.step6.desc": { zh: "APA 格式输出、图表导出、论文段落", en: "APA format output, chart export, paper paragraphs" },

  // Settings
  "settings.title": { zh: "API 设置", en: "API Settings" },
  "settings.desc": { zh: "配置你的 API Key，即可在工作台中使用所有工具。密钥仅保存在浏览器本地，不会上传到任何服务器。", en: "Configure your API Key to use all tools in the workspace. Keys are stored locally in your browser only." },
  "settings.configured": { zh: "已配置", en: "Configured" },
  "settings.test": { zh: "测试连接", en: "Test Connection" },
  "settings.testing": { zh: "测试中...", en: "Testing..." },
  "settings.success": { zh: "连接成功", en: "Connected" },
  "settings.failed": { zh: "连接失败", en: "Failed" },
  "settings.security": { zh: "安全说明", en: "Security Notice" },

  // Common
  "common.back": { zh: "返回", en: "Back" },
  "common.back.workspace": { zh: "返回工作台", en: "Back to Workspace" },
  "common.back.home": { zh: "返回首页", en: "Back to Home" },
  "common.loading": { zh: "加载中...", en: "Loading..." },
  "common.error": { zh: "出现了问题", en: "Something went wrong" },
  "common.retry": { zh: "重试", en: "Retry" },
  "common.copy": { zh: "复制", en: "Copy" },
  "common.copied": { zh: "已复制", en: "Copied" },
  "common.download": { zh: "导出", en: "Export" },
  "common.calculate": { zh: "计算", en: "Calculate" },
  "common.analyze": { zh: "开始分析", en: "Start Analysis" },
  "common.analyzing": { zh: "分析中...", en: "Analyzing..." },
  "common.upload": { zh: "上传数据文件", en: "Upload Data File" },
  "common.results": { zh: "分析结果", en: "Results" },
  "common.history": { zh: "历史记录", en: "History" },
  "common.clear": { zh: "清空", en: "Clear" },

  // Footer
  "footer.desc": { zh: "市场营销 × 消费者行为研究的开源项目发现平台。汇聚全球优质工具，助力数据驱动的营销决策。", en: "Open-source project discovery platform for marketing × consumer behavior research. Curating global tools for data-driven marketing decisions." },
  "footer.links": { zh: "快速链接", en: "Quick Links" },
  "footer.resources": { zh: "资源", en: "Resources" },
  "footer.all.projects": { zh: "全部项目", en: "All Projects" },
  "footer.workspace": { zh: "工作台", en: "Workspace" },
  "footer.compare": { zh: "项目对比", en: "Compare" },
  "footer.settings": { zh: "API 设置", en: "API Settings" },
  "footer.github": { zh: "GitHub 仓库", en: "GitHub Repo" },
  "footer.literature": { zh: "文献搜索", en: "Literature Search" },
  "footer.copyright": { zh: "© 2026 MarTech Open Hub. All rights reserved.", en: "© 2026 MarTech Open Hub. All rights reserved." },

  // 404
  "notfound.title": { zh: "页面未找到", en: "Page Not Found" },
  "notfound.desc": { zh: "你访问的页面不存在，可能已被移动或删除。", en: "The page you're looking for doesn't exist or has been moved." },
  "notfound.home": { zh: "返回首页", en: "Go Home" },

  // Language
  "lang.switch": { zh: "English", en: "中文" },
};

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      lang: "zh",
      setLang: (lang) => set({ lang }),
      t: (key: string) => {
        const entry = translations[key];
        if (!entry) return key;
        return entry[get().lang] ?? entry.zh ?? key;
      },
    }),
    { name: "martech-i18n" }
  )
);
