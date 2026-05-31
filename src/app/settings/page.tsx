"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Check, Trash2, ChevronDown, Shield, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAPIStore, API_PROVIDERS } from "@/lib/api/config";
import { testConnection, type ConnectionTestResult } from "@/lib/api/test-connection";
import { cn } from "@/lib/utils";

const PROVIDER_META: Record<string, { icon: string; color: string; desc: string; recommended: string; features: string[] }> = {
  openai: { icon: "🟢", color: "#10B981", desc: "GPT-4o 系列，全球最广泛使用的 LLM", recommended: "gpt-4o", features: ["函数调用", "视觉理解", "JSON 输出"] },
  anthropic: { icon: "🟠", color: "#F97316", desc: "Claude 系列，擅长长文本和推理", recommended: "claude-sonnet-4-20250514", features: ["200K 上下文", "工具调用", "安全对齐"] },
  gemini: { icon: "🔵", color: "#3B82F6", desc: "Google Gemini，多模态原生支持", recommended: "gemini-2.0-flash", features: ["多模态", "长上下文", "免费额度"] },
  mimo: { icon: "🟣", color: "#8B5CF6", desc: "小米 MiMo，国产旗舰推理模型", recommended: "mimo-v2.5-pro", features: ["1M 上下文", "深度思考", "多模态"] },
  deepseek: { icon: "🟢", color: "#10B981", desc: "深度求索，国产性价比之王", recommended: "deepseek-v4-flash", features: ["1M 上下文", "思考模式", "超低价格"] },
  qwen: { icon: "🟠", color: "#F59E0B", desc: "阿里通义千问，国产全能选手", recommended: "qwen3.6-plus", features: ["1M 上下文", "内置工具", "批量推理"] },
  kimi: { icon: "🟡", color: "#FBBF24", desc: "月之暗面 Kimi，长程代码和多模态", recommended: "kimi-k2.6", features: ["256K 上下文", "视觉理解", "深度思考"] },
  doubao: { icon: "🔴", color: "#EF4444", desc: "字节跳动豆包，Seed 2.0 系列", recommended: "doubao-seed-2.0-pro-256k", features: ["256K 上下文", "多模态", "代码优化"] },
  wenxin: { icon: "🔵", color: "#3B82F6", desc: "百度文心一言，ERNIE 5.1 旗舰", recommended: "ernie-5.1", features: ["128K 上下文", "联网搜索", "中文优化"] },
  spark: { icon: "🟣", color: "#A855F7", desc: "讯飞星火，X1.5 快思考模式", recommended: "4.0Ultra", features: ["32K 上下文", "联网搜索", "免费 Lite"] },
  zhipu: { icon: "🟢", color: "#14B8A6", desc: "智谱 GLM，GLM-5.1 旗舰", recommended: "glm-5.1", features: ["200K 上下文", "深度思考", "代码优化"] },
  custom: { icon: "⚙️", color: "#64748B", desc: "任意 OpenAI 兼容端点", recommended: "", features: ["自定义 Base URL", "自定义模型", "完全灵活"] },
};

export default function SettingsPage() {
  const { configs, setConfig, removeConfig } = useAPIStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const configuredCount = Object.values(configs).filter((c) => c.apiKey).length;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </Link>

        <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">API 设置</span></h1>
        <p className="text-[var(--text-secondary)] mb-2">
          配置 AI 模型提供商，即可在工作台中使用所有工具。
        </p>
        <div className="flex items-center gap-3 mb-8">
          <Badge variant="outline" className={cn("text-xs", configuredCount > 0 ? "border-[var(--success)]/30 text-[var(--success)]" : "border-[var(--warning)]/30 text-[var(--warning)]")}>
            {configuredCount > 0 ? <><Check className="w-3 h-3 mr-1" /> {configuredCount} 个已配置</> : "未配置"}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
            <Shield className="w-3 h-3" /> 密钥仅存浏览器本地
          </div>
        </div>

        {/* Provider cards */}
        <div className="space-y-3">
          {API_PROVIDERS.map((provider) => {
            const meta = PROVIDER_META[provider.id] ?? PROVIDER_META.custom;
            const config = configs[provider.id];
            const hasKey = !!config?.apiKey;
            const isExpanded = expandedId === provider.id;

            return (
              <motion.div key={provider.id}
                layout
                className={cn("glass-card overflow-hidden transition-all", hasKey && "border-[var(--success)]/20")}>
                {/* Card header — always visible */}
                <button onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[var(--bg-card-hover)] transition-colors">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${meta.color}15` }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{provider.name}</span>
                      {hasKey && <Badge variant="outline" className="text-[9px] border-[var(--success)]/30 text-[var(--success)]">已配置</Badge>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{meta.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {meta.features.map((f) => (
                        <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasKey && <span className="text-xs text-[var(--success)] font-mono">{config?.model || "—"}</span>}
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    </motion.div>
                  </div>
                </button>

                {/* Expanded configuration */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] space-y-3">
                        {/* Base URL (for custom) */}
                        {provider.id === "custom" && (
                          <div>
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">API Base URL</label>
                            <Input placeholder="https://your-api.com/v1"
                              value={config?.baseUrl ?? ""}
                              onChange={(e) => setConfig(provider.id, { baseUrl: e.target.value })}
                              className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
                          </div>
                        )}

                        {/* API Key */}
                        <div>
                          <label className="text-xs text-[var(--text-muted)] mb-1 block">API Key</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input type={showKeys[provider.id] ? "text" : "password"}
                                placeholder={`输入 ${provider.name} API Key`}
                                value={config?.apiKey ?? ""}
                                onChange={(e) => setConfig(provider.id, { apiKey: e.target.value })}
                                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] pr-10" />
                              <button onClick={() => setShowKeys((s) => ({ ...s, [provider.id]: !s[provider.id] }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {hasKey && (
                              <Button variant="ghost" size="icon" className="text-[var(--text-muted)] hover:text-[var(--error)]"
                                onClick={() => removeConfig(provider.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Model selector */}
                        <div>
                          <label className="text-xs text-[var(--text-muted)] mb-1 block">模型</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {provider.models.map((m) => (
                              <button key={m} onClick={() => setConfig(provider.id, { model: m })}
                                className={cn("px-3 py-2 rounded-lg text-xs border transition-all text-left",
                                  config?.model === m
                                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/30"
                                )}>
                                <span className="font-mono">{m}</span>
                                {m === meta.recommended && (
                                  <span className="block text-[9px] text-[var(--warm)] mt-0.5">⭐ 推荐</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Status & Usage Metrics */}
                        {hasKey && config?.usage && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-[var(--success)]">
                              <Check className="w-3 h-3" /> 配置完成
                              {config.usage.lastLatencyMs && (
                                <span className="text-[var(--text-muted)]">· 延迟 {config.usage.lastLatencyMs}ms</span>
                              )}
                            </div>

                            {/* Usage metrics grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { label: "请求数", value: config.usage.totalRequests.toLocaleString(), icon: "📊" },
                                { label: "总 Tokens", value: config.usage.totalTokens >= 1000000 ? `${(config.usage.totalTokens / 1000000).toFixed(1)}M` : config.usage.totalTokens >= 1000 ? `${(config.usage.totalTokens / 1000).toFixed(1)}K` : String(config.usage.totalTokens), icon: "🔤" },
                                { label: "预估费用", value: `${provider.pricing?.unit?.includes("¥") ? "¥" : "$"}${config.usage.estimatedCost.toFixed(2)}`, icon: "💰" },
                                { label: "上次使用", value: config.usage.lastUsed ? new Date(config.usage.lastUsed).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—", icon: "🕐" },
                              ].map((m) => (
                                <div key={m.label} className="p-2 rounded-lg bg-[var(--bg-card)] text-center">
                                  <div className="text-[10px] text-[var(--text-muted)]">{m.icon} {m.label}</div>
                                  <div className="text-sm font-mono font-medium text-[var(--text-primary)] mt-0.5">{m.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Token breakdown bar */}
                            {config.usage.totalTokens > 0 && (
                              <div>
                                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                                  <span>Token 分布</span>
                                  <span>{config.usage.inputTokens.toLocaleString()} 输入 / {config.usage.outputTokens.toLocaleString()} 输出</span>
                                </div>
                                <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex">
                                  <div className="h-full bg-[var(--primary)]" style={{ width: `${(config.usage.inputTokens / config.usage.totalTokens) * 100}%` }} />
                                  <div className="h-full bg-[var(--accent)]" style={{ width: `${(config.usage.outputTokens / config.usage.totalTokens) * 100}%` }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-0.5">
                                  <span><span className="inline-block w-2 h-2 rounded-full bg-[var(--primary)] mr-1" />输入</span>
                                  <span><span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)] mr-1" />输出</span>
                                </div>
                              </div>
                            )}

                            {/* Pricing info */}
                            {provider.pricing && (
                              <div className="text-[10px] text-[var(--text-muted)]">
                                💡 定价：输入 {provider.pricing.input} / 输出 {provider.pricing.output} {provider.pricing.unit}
                              </div>
                            )}
                          </div>
                        )}

                        {hasKey && !config?.usage && (
                          <div className="flex items-center gap-2 text-xs text-[var(--success)]">
                            <Check className="w-3 h-3" /> 配置完成，可在工作台中使用
                          </div>
                        )}

                        {/* Test Connection Button */}
                        {hasKey && (
                          <div className="mt-3">
                            <button
                              onClick={async () => {
                                setTesting((prev) => ({ ...prev, [provider.id]: true }));
                                setTestResults((prev) => ({ ...prev, [provider.id]: undefined as unknown as ConnectionTestResult }));
                                const result = await testConnection(provider.id);
                                setTestResults((prev) => ({ ...prev, [provider.id]: result }));
                                setTesting((prev) => ({ ...prev, [provider.id]: false }));
                              }}
                              disabled={testing[provider.id]}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors disabled:opacity-50"
                            >
                              {testing[provider.id] ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> 测试中...</>
                              ) : (
                                <><Zap className="w-3 h-3" /> 测试连接</>
                              )}
                            </button>

                            {testResults[provider.id] && (
                              <div className={cn(
                                "mt-2 p-2 rounded-lg text-xs",
                                testResults[provider.id].success
                                  ? "bg-[var(--success)]/5 border border-[var(--success)]/20"
                                  : "bg-[var(--error)]/5 border border-[var(--error)]/20"
                              )}>
                                {testResults[provider.id].success ? (
                                  <span className="text-[var(--success)]">
                                    ✓ 连接成功 · 延迟 {testResults[provider.id].latencyMs}ms · 模型: {testResults[provider.id].model}
                                  </span>
                                ) : (
                                  <span className="text-[var(--error)]">
                                    ✗ {testResults[provider.id].error}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Security note */}
        <div className="glass-card p-4 mt-8">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--success)]" /> 安全说明
          </h3>
          <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
            <li>• 所有 API Key 仅存储在浏览器 localStorage 中</li>
            <li>• 请求直接从浏览器发送到各 API 提供商，不经过本平台服务器</li>
            <li>• 清除浏览器数据会丢失配置，建议妥善保管 Key</li>
            <li>• 本平台不收集、存储或传输你的任何 API 密钥</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
