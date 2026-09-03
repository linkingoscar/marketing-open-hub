import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  config: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { config, messages, temperature = 0.7, maxTokens = 2000, stream = false } = body;

    if (!config?.apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 400 });
    }

    const openaiCompatible = [
      "openai", "deepseek", "mimo", "qwen", "kimi",
      "doubao", "spark", "zhipu", "custom",
    ];

    // 1. OpenAI-compatible
    if (openaiCompatible.includes(config.provider)) {
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
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: `Upstream error (${res.status}): ${errorText}` }, { status: res.status });
      }

      if (stream && res.body) {
        return new Response(res.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
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
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: `Anthropic error (${res.status}): ${errorText}` }, { status: res.status });
      }

      if (stream && res.body) {
        return new Response(res.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
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
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: `Gemini error (${res.status}): ${errorText}` }, { status: res.status });
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: `Unsupported provider: ${config.provider}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
