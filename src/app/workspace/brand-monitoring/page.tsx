"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { cn } from "@/lib/utils";

type Mode = "visibility" | "sentiment" | "competitor" | "crisis";

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "visibility", label: "品牌可见性", desc: "模拟多 AI 模型中品牌被提及的概率和排名" },
  { id: "sentiment", label: "舆情监测", desc: "分析品牌在社媒/评论中的情感倾向和关键话题" },
  { id: "competitor", label: "竞品对比", desc: "多品牌在知名度/好感度/相关性维度的对比" },
  { id: "crisis", label: "危机预警", desc: "检测负面舆情信号，评估品牌风险等级" },
];

export default function BrandMonitoringPage() {
  const [mode, setMode] = useState<Mode>("visibility");
  const [brandName, setBrandName] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const PROMPTS: Record<Mode, string> = {
    visibility: `你是 GEO Insight 品牌可见性分析引擎。给定品牌名 "${brandName}"，模拟以下 AI 模型对该品牌的认知：

1. DeepSeek - 技术/学术视角：该品牌被提及的概率(0-100)、典型回答片段、排名位置
2. Kimi - 长文/深度视角：同上
3. 文心一言 - 中文/商业视角：同上
4. 豆包 - 生活/娱乐视角：同上
5. 通义千问 - 综合视角：同上

输出 JSON：
{
  "brand": "${brandName}",
  "overall_geo_score": 0-100,
  "per_model": [{ "model": "...", "mention_probability": 0-100, "typical_response": "...", "ranking": 1-10 }],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."]
}`,
    sentiment: `你是品牌舆情分析专家。分析品牌 "${brandName}" 的舆情状况。

${textInput ? `以下是收集到的舆情数据：\n${textInput}` : "请基于你的知识，模拟分析该品牌近期的舆情状况。"}

输出 JSON：
{
  "brand": "${brandName}",
  "overall_sentiment": "positive/neutral/negative",
  "sentiment_score": -1.0 到 1.0,
  "key_topics": [{ "topic": "...", "sentiment": "...", "volume": "high/medium/low", "sample_quotes": ["..."] }],
  "trend": "improving/stable/declining",
  "risk_level": "low/medium/high",
  "alerts": ["..."],
  "recommendations": ["..."]
}`,
    competitor: `你是竞争情报分析师。对比品牌 "${brandName}" 与竞品 ${competitors || "（请自行识别主要竞品）"}。

从以下维度对比，每个品牌每个维度 0-100 分：
1. 知名度 (Awareness)
2. 好感度 (Favorability)  
3. 相关性 (Relevance)
4. 创新感知 (Innovation)
5. 性价比感知 (Value)

输出 JSON：
{
  "brands": ["${brandName}", ...竞品],
  "dimensions": ["知名度", "好感度", "相关性", "创新感知", "性价比"],
  "scores": { "${brandName}": [80, 70, ...], "竞品A": [...] },
  "summary": "...",
  "competitive_advantages": ["..."],
  "competitive_gaps": ["..."],
  "recommendations": ["..."]
}`,
    crisis: `你是品牌危机预警分析师。检测品牌 "${brandName}" 的潜在危机信号。

${textInput ? `以下是相关数据：\n${textInput}` : "请基于你的知识，模拟分析该品牌的潜在风险。"}

输出 JSON：
{
  "brand": "${brandName}",
  "risk_level": "low/medium/high/critical",
  "active_risks": [{ "risk": "...", "severity": "low/medium/high", "probability": "low/medium/high", "impact": "...", "mitigation": "..." }],
  "monitoring_keywords": ["..."],
  "early_warning_signals": ["..."],
  "response_playbook": ["..."]
}`,
  };

  const handleRun = async () => {
    if (!brandName.trim() || !hasAnyKey()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: "你是一个专业的品牌分析引擎。输出严格 JSON 格式。" },
          { role: "user", content: PROMPTS[mode] },
        ],
        temperature: 0.3,
        maxTokens: 3000,
        stream: true,
        onChunk: (text) => setResult((prev) => prev + text),
      });
      if (!result) setResult(res);
      addRecord({ tool: "brand-monitoring", type: MODES.find((m) => m.id === mode)!.label, input: brandName, result: res || result });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-xl">🏷️</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">品牌监测</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 GEO-Insight · SocialPulse · Sentiment-Analysis-for-Branding</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">输入品牌名，AI 模拟多平台搜索，输出可见性评分、舆情分析、竞品对比</p>

        {!hasAnyKey() && (
          <div className="glass-card p-4 mb-6 border-[var(--warning)]/30">
            <p className="text-sm text-[var(--warning)]">⚠️ 尚未配置 API Key。<Link href="/settings" className="underline ml-1">前往设置</Link></p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setResult(""); }}
              className={cn("px-3 py-1.5 rounded-full text-sm border transition-colors",
                mode === m.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
              )}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">品牌名称</label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="例如：小米、Nike、星巴克..."
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
            </div>

            {(mode === "competitor") && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">竞品名称（逗号分隔，可选）</label>
                <Input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="华为, 苹果, 三星"
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
              </div>
            )}

            {(mode === "sentiment" || mode === "crisis") && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">舆情数据（可选，粘贴评论/社媒内容）</label>
                <Textarea rows={6} value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  placeholder="粘贴收集到的评论、社媒帖子等..."
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
              </div>
            )}

            <Button onClick={handleRun} disabled={loading || !brandName.trim() || !hasAnyKey()}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中...</> : <><Play className="w-4 h-4 mr-2" /> 开始分析</>}
            </Button>

            <HistoryPanel tool="brand-monitoring" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">分析结果</label>
              {result && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                  const blob = new Blob([result], { type: "text/markdown" }); const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `brand-${mode}-${Date.now()}.md`; a.click();
                }}>
                  <Download className="w-3 h-3 mr-1" /> 导出
                </Button>
              )}
            </div>
            <div className="glass-card p-6 min-h-[400px] max-h-[700px] overflow-y-auto">
              {error ? (
                <div className="text-[var(--error)] text-sm">{error}</div>
              ) : result ? (
                <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{result}</pre>
              ) : (
                <div className="text-[var(--text-muted)] text-sm text-center py-20">
                  <Eye className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>输入品牌名称，选择分析模式</p>
                  <p className="text-xs mt-1">AI 将模拟多平台搜索，输出品牌洞察</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
