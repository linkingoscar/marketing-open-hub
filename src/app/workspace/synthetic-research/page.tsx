"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, Copy, Check, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { cn } from "@/lib/utils";

const PRESETS = [
  { id: "purchase-intent", label: "购买意向测试", systemPrompt: "你是一个消费者调研专家。请根据以下产品描述，从 5 个不同消费者视角（价格敏感型、品质追求型、早期采用者、保守型、随机型）分别给出：1) 购买意向评分(1-5) 2) 一句话理由 3) 最关心的 3 个问题。输出 JSON 格式。", placeholder: "描述你的产品/服务，例如：一款 AI 写作助手，月费 $29，帮助营销人员生成社媒内容..." },
  { id: "concept-test", label: "概念测试", systemPrompt: "你是一个市场研究专家。请对以下产品概念进行评估：1) 目标人群画像 2) 核心价值主张 3) 潜在竞品 4) 定价建议 5) 上市风险。每个维度给出 3-5 个要点。", placeholder: "描述你的产品概念..." },
  { id: "sentiment-analysis", label: "情感分析", systemPrompt: "你是一个 NLP 情感分析专家。请对以下文本进行分析：1) 整体情感(正面/中性/负面) 2) 情感分数(-1到1) 3) 关键情感词 4) 潜在意图 5) 一句话摘要。输出 JSON 格式。", placeholder: "输入要分析的文本（评论、社媒帖子等）..." },
  { id: "competitor-analysis", label: "竞品分析", systemPrompt: "你是一个竞争情报分析师。请根据以下信息进行竞品分析：1) 直接竞品列表 2) 各竞品优劣势 3) 市场空白点 4) 差异化建议 5) 定位策略。", placeholder: "描述你的产品和目标市场..." },
  { id: "user-persona", label: "用户画像生成", systemPrompt: "你是一个用户研究专家。请根据以下产品信息生成 3 个典型用户画像：每个画像包含 姓名/年龄/职业/收入/痛点/使用场景/决策因素/信息获取渠道。输出 JSON 格式。", placeholder: "描述你的产品和目标用户..." },
  { id: "custom", label: "自定义", systemPrompt: "", placeholder: "输入你的研究需求..." },
];

export default function SyntheticResearchPage() {
  const [selectedPreset, setSelectedPreset] = useState("purchase-intent");
  const [userInput, setUserInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(PRESETS[0].systemPrompt);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const { hasAnyKey } = useAPIStore();

  const handlePresetChange = (id: string) => {
    setSelectedPreset(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset && id !== "custom") {
      setSystemPrompt(preset.systemPrompt);
    }
  };

  const handleRun = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    setStreaming(true);

    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput },
        ],
        temperature: 0.7,
        maxTokens: 3000,
        stream: true,
        onChunk: (text) => setResult((prev) => prev + text),
      });
      if (!result) setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "调用失败");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-${selectedPreset}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentPreset = PRESETS.find((p) => p.id === selectedPreset);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-xl">🧪</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI 模拟调研</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 synthetic-market-research / MicroCrowd / Tunnel 方法论</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">输入产品概念，AI 模拟多个人格消费者给出反馈、评分和建议</p>
        <ActiveProviderBadge className="mb-6" />

        {!hasAnyKey() && (
          <div className="glass-card p-4 mb-6 border-[var(--warning)]/30">
            <p className="text-sm text-[var(--warning)]">
              ⚠️ 尚未配置 API Key。
              <Link href="/settings" className="underline ml-1">前往设置</Link> 配置后即可使用。
            </p>
          </div>
        )}

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => handlePresetChange(p.id)}
              className={cn("px-3 py-1.5 rounded-full text-sm border transition-colors",
                selectedPreset === p.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              )}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            {selectedPreset === "custom" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">系统提示词（定义 AI 角色和输出格式）</label>
                <Textarea rows={4} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="你是一个市场研究专家..."
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
              </div>
            )}
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">
                {selectedPreset === "custom" ? "用户输入" : "产品/研究描述"}
              </label>
              <Textarea rows={8} value={userInput} onChange={(e) => setUserInput(e.target.value)}
                placeholder={currentPreset?.placeholder ?? "输入你的研究需求..."}
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
            </div>
            <Button onClick={handleRun} disabled={loading || !userInput.trim() || !hasAnyKey()}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中...</> : <><Play className="w-4 h-4 mr-2" /> 开始分析</>}
            </Button>
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">分析结果</label>
              {result && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[var(--text-muted)]" onClick={copyResult}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[var(--text-muted)]" onClick={downloadResult}>
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className={cn("glass-card p-6 min-h-[300px] max-h-[600px] overflow-y-auto", streaming && "animate-pulse-glow")}>
              {error ? (
                <div className="text-[var(--error)] text-sm">{error}</div>
              ) : result ? (
                <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{result}</pre>
              ) : (
                <div className="text-[var(--text-muted)] text-sm text-center py-20">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>选择调研类型，输入产品描述，点击“开始分析”</p>
                  <p className="text-xs mt-1">结果将在这里实时展示</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
