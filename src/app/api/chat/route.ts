import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  config: {
    provider: string;
    apiKey: string;
    baseUrl?: string;
    model: string;
  };
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * 官方 Provider 标准服务端入口映射
 * 杜绝客户端篡改内置供应商的 baseUrl 引发请求劫持
 */
const TRUSTED_PROVIDER_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  deepseek: "https://api.deepseek.com",
  mimo: "https://api.xiaomimimo.com/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  kimi: "https://api.moonshot.cn/v1",
  doubao: "https://ark.cn-beijing.volces.com/api/v3",
  spark: "https://spark-api-open.xf-yun.com/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

/**
 * 严格阻断私有/内网 IP 以及云平台元数据服务（防 SSRF）
 */
function isBlockedTargetUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return true;

    // 生产环境下强制 https
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return true;
    }

    const hostname = parsed.hostname.toLowerCase();
    // 阻断 localhost 及回环
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0" ||
      hostname === "169.254.169.254" // AWS/GCP/Alibaba metadata
    ) {
      return true;
    }

    // 检查私有 IPv4 地址段 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
    const parts = hostname.split(".").map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
      if (parts[0] === 10 || parts[0] === 127) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
    }

    return false;
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { config, messages, temperature = 0.7, maxTokens = 2000, stream = false } = body;

    if (!config?.apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    // 解析目标 baseUrl
    let targetBaseUrl = TRUSTED_PROVIDER_BASE_URLS[config.provider];
    if (!targetBaseUrl) {
      if (config.provider === "custom") {
        if (!config.baseUrl || isBlockedTargetUrl(config.baseUrl)) {
          return NextResponse.json(
            {
              error:
                "Invalid or prohibited custom baseUrl (private IPs and unencrypted protocols are blocked)",
            },
            { status: 400 }
          );
        }
        targetBaseUrl = config.baseUrl.replace(/\/+$/, "");
      } else {
        return NextResponse.json(
          { error: `Unsupported provider: ${config.provider}` },
          { status: 400 }
        );
      }
    }

    const openaiCompatible = [
      "openai",
      "deepseek",
      "mimo",
      "qwen",
      "kimi",
      "doubao",
      "spark",
      "zhipu",
      "custom",
    ];

    // 1. OpenAI-compatible
    if (openaiCompatible.includes(config.provider)) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.provider === "mimo") {
        headers["api-key"] = config.apiKey;
      } else {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const res = await fetch(`${targetBaseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { error: `Upstream error (${res.status}): ${errorText}` },
          { status: res.status }
        );
      }

      if (stream && res.body) {
        return new Response(res.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      return NextResponse.json({ text });
    }

    // 2. Anthropic
    if (config.provider === "anthropic") {
      const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
      const userMessages = messages.filter((m) => m.role !== "system");

      const res = await fetch(`${targetBaseUrl}/messages`, {
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
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { error: `Anthropic error (${res.status}): ${errorText}` },
          { status: res.status }
        );
      }

      if (stream && res.body) {
        return new Response(res.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";
      return NextResponse.json({ text });
    }

    // 3. Gemini
    if (config.provider === "gemini") {
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const systemMsg = messages.find((m) => m.role === "system")?.content;

      const res = await fetch(`${targetBaseUrl}/models/${config.model}:generateContent`, {
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
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { error: `Gemini error (${res.status}): ${errorText}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return NextResponse.json({ text });
    }

    return NextResponse.json(
      { error: `Unsupported provider: ${config.provider}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
