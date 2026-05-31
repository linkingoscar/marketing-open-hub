"use client";

import { useAPIStore } from "./config";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onChunk?: (text: string) => void;
}

/** Estimate token count — CJK chars ≈ 1.5 tokens, others ≈ 0.25 tokens per char */
function estimateTokens(text: string): number {
  let count = 0;
  for (const ch of text) {
    count += /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(ch) ? 1.5 : 0.25;
  }
  return Math.ceil(count);
}

export async function callLLM(options: CallOptions): Promise<string> {
  const store = useAPIStore.getState();
  const allConfigs = store.getAllConfigs();

  if (allConfigs.length === 0) {
    throw new Error("未配置 API Key。请先在设置页面配置。");
  }

  // Try preferred config first, then fallback to others
  const preferred = store.getActiveConfig();
  const configsToTry = preferred
    ? [preferred, ...allConfigs.filter((c) => c.provider !== preferred.provider)]
    : allConfigs;

  let lastError: Error | null = null;

  for (const config of configsToTry) {
    const startTime = Date.now();
    try {
      const result = await callWithConfig(config, options);
      const latencyMs = Date.now() - startTime;
      const inputTokens = options.messages.reduce((s, m) => s + estimateTokens(m.content), 0);
      const outputTokens = estimateTokens(result);
      store.recordUsage(config.provider, inputTokens, outputTokens, latencyMs);
      return result;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`[API] ${config.provider} failed: ${lastError.message}, trying next...`);
      continue;
    }
  }

  throw lastError ?? new Error("所有 API 提供商均调用失败");
}

async function callWithConfig(config: { provider: string; apiKey: string; baseUrl: string; model: string }, options: CallOptions): Promise<string> {
  const { messages, temperature = 0.7, maxTokens = 2000, stream = false, onChunk } = options;

  // 30s timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    // OpenAI-compatible API (works for OpenAI, DeepSeek, MiMo, Qwen, Kimi, Doubao, Spark, Zhipu, custom endpoints)
    const openaiCompatibleProviders = ["openai", "deepseek", "mimo", "qwen", "kimi", "doubao", "spark", "zhipu", "custom"];
    if (openaiCompatibleProviders.includes(config.provider)) {
      // MiMo uses "api-key" header instead of "Authorization: Bearer"
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.provider === "mimo") {
        headers["api-key"] = config.apiKey;
      } else {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API 调用失败: ${res.status} - ${err}`);
      }

      if (stream && onChunk) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const text = json.choices?.[0]?.delta?.content ?? "";
                full += text;
                onChunk(text);
              } catch (e) { console.warn("[SSE] Parse chunk failed:", e); }
            }
          }
        }
        return full;
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }

    // Anthropic API
    if (config.provider === "anthropic") {
      const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
      const userMessages = messages.filter((m) => m.role !== "system");

      const res = await fetch(`${config.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          system: systemMsg,
          messages: userMessages,
          max_tokens: maxTokens,
          temperature,
          stream,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API 调用失败: ${res.status} - ${err}`);
      }

      if (stream && onChunk) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.type === "content_block_delta") {
                  const text = json.delta?.text ?? "";
                  full += text;
                  onChunk(text);
                }
              } catch (e) { console.warn("[SSE] Parse Anthropic chunk failed:", e); }
            }
          }
        }
        return full;
      }

      const data = await res.json();
      return data.content?.[0]?.text ?? "";
    }

    // Gemini API
    if (config.provider === "gemini") {
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const systemMsg = messages.find((m) => m.role === "system")?.content;

      const res = await fetch(
        `${config.baseUrl}/models/${config.model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.apiKey,
          },
          body: JSON.stringify({
            contents,
            ...(systemMsg && { systemInstruction: { parts: [{ text: systemMsg }] } }),
            generationConfig: { temperature, maxOutputTokens: maxTokens },
          }),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API 调用失败: ${res.status} - ${err}`);
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    throw new Error(`不支持的 API 提供商: ${config.provider}`);
  } finally {
    clearTimeout(timeout);
  }
}
