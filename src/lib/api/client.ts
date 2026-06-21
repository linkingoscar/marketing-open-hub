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

/**
 * Read an SSE stream with proper cross-chunk line buffering.
 * Handles incomplete lines split across TCP chunks.
 */
async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onLine: (line: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) break;

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split by newlines, but keep the last incomplete segment in buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // last element may be incomplete

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) onLine(trimmed);
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) onLine(buffer.trim());
}

/**
 * Parse SSE data lines for OpenAI-compatible providers.
 * Returns the extracted text content.
 */
function parseOpenAISSELine(line: string): string | null {
  if (!line.startsWith("data: ") || line === "data: [DONE]") return null;
  try {
    const json = JSON.parse(line.slice(6));
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

/**
 * Parse SSE data lines for Anthropic providers.
 * Returns the extracted text content.
 */
function parseAnthropicSSELine(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  try {
    const json = JSON.parse(line.slice(6));
    if (json.type === "content_block_delta") {
      return json.delta?.text ?? null;
    }
    return null;
  } catch {
    return null;
  }
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

  // 120s timeout — LLM responses can be slow for long outputs
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

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
        if (!reader) throw new Error("无法读取响应流");

        let full = "";
        await readSSEStream(reader, (line) => {
          const text = parseOpenAISSELine(line);
          if (text) {
            full += text;
            onChunk(text);
          }
        }, controller.signal);
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
        if (!reader) throw new Error("无法读取响应流");

        let full = "";
        await readSSEStream(reader, (line) => {
          const text = parseAnthropicSSELine(line);
          if (text) {
            full += text;
            onChunk(text);
          }
        }, controller.signal);
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
