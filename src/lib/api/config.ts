"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface APIProvider {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  pricing?: { input: number; output: number; unit: string }; // per MTok
}

export interface APIUsage {
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  lastUsed: string | null;
  lastLatencyMs: number | null;
}

export const API_PROVIDERS: APIProvider[] = [
  // 海外模型（按官方文档更新，2026-05-31）
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", models: ["gpt-5.5", "gpt-5.4-mini", "gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini", "o4-mini", "o3-pro"], pricing: { input: 2.00, output: 8.00, unit: "$/MTok" } },
  { id: "anthropic", name: "Anthropic (Claude)", baseUrl: "https://api.anthropic.com/v1", models: ["claude-opus-4-8", "claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5-20251001"], pricing: { input: 5.00, output: 25.00, unit: "$/MTok" } },
  { id: "gemini", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"], pricing: { input: 1.25, output: 10.00, unit: "$/MTok" } },
  // 国产模型（按官方文档更新，2026-05-31）
  { id: "mimo", name: "小米 MiMo", baseUrl: "https://api.xiaomimimo.com/v1", models: ["mimo-v2.5-pro", "mimo-v2.5", "mimo-v2-flash"], pricing: { input: 1.00, output: 3.00, unit: "$/MTok" } },
  { id: "deepseek", name: "DeepSeek (深度求索)", baseUrl: "https://api.deepseek.com", models: ["deepseek-v4-flash", "deepseek-v4-pro"], pricing: { input: 0.14, output: 0.28, unit: "$/MTok" } },
  { id: "qwen", name: "通义千问 (Qwen)", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", models: ["qwen3.7-max", "qwen3.6-plus", "qwen3.6-flash", "qwen-plus", "qwen-turbo"], pricing: { input: 1.60, output: 6.40, unit: "¥/MTok" } },
  { id: "kimi", name: "Kimi (月之暗面)", baseUrl: "https://api.moonshot.cn/v1", models: ["kimi-k2.6", "kimi-k2.5", "moonshot-v1-128k", "moonshot-v1-32k"], pricing: { input: 6.00, output: 18.00, unit: "¥/MTok" } },
  { id: "doubao", name: "豆包 (字节跳动)", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", models: ["doubao-seed-2.0-pro-256k", "doubao-seed-2.0-lite-32k", "doubao-seed-2.0-mini-32k", "doubao-seed-2.0-code-32k"], pricing: { input: 0.80, output: 2.00, unit: "¥/MTok" } },
  { id: "wenxin", name: "文心一言 (百度)", baseUrl: "https://qianfan.baidubce.com/v2", models: ["ernie-5.1", "ernie-5.0", "ernie-4.5-turbo-128k", "ernie-4.0-8k"], pricing: { input: 8.00, output: 24.00, unit: "¥/MTok" } },
  { id: "spark", name: "讯飞星火", baseUrl: "https://spark-api-open.xf-yun.com/v1", models: ["4.0Ultra", "generalv3.5", "generalv3", "lite"], pricing: { input: 5.00, output: 10.00, unit: "¥/MTok" } },
  { id: "zhipu", name: "智谱 (GLM)", baseUrl: "https://open.bigmodel.cn/api/paas/v4", models: ["glm-5.1", "glm-4.7", "glm-4.7-flash", "glm-4-plus"], pricing: { input: 5.00, output: 5.00, unit: "¥/MTok" } },
  { id: "custom", name: "自定义 (OpenAI 兼容)", baseUrl: "", models: [] },
];

interface APIConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  usage?: APIUsage;
}

interface APIStore {
  configs: Record<string, APIConfig>;
  preferredProvider: string | null;
  setConfig: (provider: string, config: Partial<APIConfig>) => void;
  removeConfig: (provider: string) => void;
  setPreferredProvider: (providerId: string | null) => void;
  getActiveConfig: () => APIConfig | null;
  getAllConfigs: () => APIConfig[];
  hasAnyKey: () => boolean;
  recordUsage: (providerId: string, inputTokens: number, outputTokens: number, latencyMs: number) => void;
}

export const useAPIStore = create<APIStore>()(
  persist(
    (set, get) => ({
      configs: {},
      preferredProvider: null,
      setConfig: (provider, config) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [provider]: { ...state.configs[provider], provider, ...config },
          },
        })),
      removeConfig: (provider) =>
        set((state) => {
          const { [provider]: _removed, ...rest } = state.configs;
          return { configs: rest };
        }),
      setPreferredProvider: (providerId) => set({ preferredProvider: providerId }),
      getActiveConfig: () => {
        const { configs, preferredProvider } = get();
        // 1. Use preferred provider if configured
        if (preferredProvider && configs[preferredProvider]?.apiKey) {
          return configs[preferredProvider];
        }
        // 2. Fall back to first configured provider
        const entries = Object.values(configs);
        return entries.find((c) => c.apiKey) ?? null;
      },
      getAllConfigs: () => {
        const { configs } = get();
        return Object.values(configs).filter((c) => c.apiKey);
      },
      hasAnyKey: () => {
        const { configs } = get();
        return Object.values(configs).some((c) => c.apiKey);
      },
      recordUsage: (providerId, inputTokens, outputTokens, latencyMs) => {
        set((state) => {
          const existing = state.configs[providerId];
          if (!existing) return state;
          const prev = existing.usage ?? { totalRequests: 0, totalTokens: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0, lastUsed: null, lastLatencyMs: null };
          const provider = API_PROVIDERS.find((p) => p.id === providerId);
          const costPerInput = provider?.pricing?.input ?? 0;
          const costPerOutput = provider?.pricing?.output ?? 0;
          const cost = (inputTokens * costPerInput + outputTokens * costPerOutput) / 1_000_000;
          return {
            configs: {
              ...state.configs,
              [providerId]: {
                ...existing,
                usage: {
                  totalRequests: prev.totalRequests + 1,
                  totalTokens: prev.totalTokens + inputTokens + outputTokens,
                  inputTokens: prev.inputTokens + inputTokens,
                  outputTokens: prev.outputTokens + outputTokens,
                  estimatedCost: prev.estimatedCost + cost,
                  lastUsed: new Date().toISOString(),
                  lastLatencyMs: latencyMs,
                },
              },
            },
          };
        });
      },
    }),
    { name: "martech-api-config" }
  )
);
