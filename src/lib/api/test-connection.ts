"use client";

import { useAPIStore, API_PROVIDERS } from "./config";

export interface ConnectionTestResult {
  provider: string;
  success: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}

export async function testConnection(providerId: string): Promise<ConnectionTestResult> {
  const store = useAPIStore.getState();
  const config = store.configs[providerId];
  if (!config?.apiKey) {
    return { provider: providerId, success: false, latencyMs: 0, model: "", error: "未配置 API Key" };
  }

  const provider = API_PROVIDERS.find((p) => p.id === providerId);
  const model = config.model || provider?.models[0] || "";
  const baseUrl = config.baseUrl || provider?.baseUrl || "";
  const startTime = Date.now();

  try {
    let res: Response;

    if (providerId === "anthropic") {
      // Anthropic Messages API
      res = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Reply with only: OK" }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(15000),
      });
    } else if (providerId === "gemini") {
      // Gemini generateContent API
      res = await fetch(
        `${baseUrl}/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Reply with only: OK" }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
    } else {
      // OpenAI-compatible API (OpenAI, DeepSeek, MiMo, Qwen, Kimi, Doubao, Spark, Zhipu, custom)
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (providerId === "mimo") {
        headers["api-key"] = config.apiKey;
      } else {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Reply with only: OK" }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(15000),
      });
    }

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { provider: providerId, success: false, latencyMs, model, error: `HTTP ${res.status}: ${errText.slice(0, 100)}` };
    }

    return { provider: providerId, success: true, latencyMs, model };
  } catch (e: unknown) {
    return {
      provider: providerId,
      success: false,
      latencyMs: Date.now() - startTime,
      model,
      error: e instanceof Error ? e.message : "连接失败",
    };
  }
}
