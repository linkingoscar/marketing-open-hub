"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Download, Copy, Check, PenTool, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { cn } from "@/lib/utils";

type SectionType = "methodology" | "results" | "discussion" | "abstract" | "literature-context" | "limitations";

const SECTIONS: { id: SectionType; label: string; icon: string; desc: string }[] = [
  { id: "methodology", label: "方法描述", icon: "📝", desc: "基于研究设计生成方法论章节" },
  { id: "results", label: "结果解读", icon: "📊", desc: "将统计结果转化为学术论文段落" },
  { id: "discussion", label: "讨论撰写", icon: "💬", desc: "解释发现的意义、与文献的关系" },
  { id: "abstract", label: "摘要生成", icon: "📋", desc: "基于全文生成结构化摘要" },
  { id: "literature-context", label: "文献定位", icon: "📚", desc: "将研究放入现有文献脉络中" },
  { id: "limitations", label: "局限性", icon: "⚠️", desc: "识别研究局限并提出改进建议" },
];

const PROMPTS: Record<SectionType, string> = {
  methodology: `你是一位学术写作专家。根据以下研究信息，撰写一段规范的"研究方法"章节。
要求：使用第三人称、过去时；遵循 APA 格式；包含研究设计、样本、数据收集、变量测量、分析方法；语言正式、客观、精确；中文撰写。`,
  results: `你是一位统计分析解读专家。将以下统计分析结果转化为规范的"结果"章节段落。
要求：使用 APA 报告格式（如 t(58) = 2.45, p = .017, d = 0.63）；先报告描述性统计，再报告假设检验结果；效应量和置信区间必须包含；中文撰写。`,
  discussion: `你是一位学术论文写作专家。根据以下研究结果，撰写"讨论"章节。
要求：解释主要发现的含义；与已有文献对比（引用格式：作者, 年份）；讨论理论贡献和实践启示；承认局限性；提出未来研究方向；中文撰写。`,
  abstract: `你是一位学术写作专家。根据以下研究内容，生成一段结构化摘要。
要求：包含背景、目的、方法、结果、结论；250-300字；不引用参考文献；关键词 3-5 个；中文撰写。`,
  "literature-context": `你是一位文献综述专家。根据以下研究主题和发现，撰写一段文献定位说明。
要求：将本研究放入现有文献脉络中；说明本研究如何填补文献空白；引用相关理论框架；中文撰写。`,
  limitations: `你是一位学术研究方法论专家。根据以下研究设计，撰写"研究局限性"段落。
要求：诚实承认方法论局限；每个局限配一个改进建议；区分致命缺陷和可接受的权衡；中文撰写。`,
};

export default function PaperWriterPage() {
  const [section, setSection] = useState<SectionType>("results");
  const [researchInfo, setResearchInfo] = useState("");
  const [analysisResults, setAnalysisResults] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const handleGenerate = async () => {
    if (!researchInfo.trim() || !hasAnyKey()) return;
    setLoading(true);
    setError("");
    setResult("");

    const currentSection = SECTIONS.find((s) => s.id === section)!;
    const fullContext = `## 研究信息\n${researchInfo}\n\n${analysisResults ? `## 分析结果\n${analysisResults}` : ""}`;

    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: PROMPTS[section] },
          { role: "user", content: fullContext },
        ],
        temperature: 0.4,
        maxTokens: 4000,
        stream: true,
        onChunk: (text) => setResult((prev) => prev + text),
      });
      if (!result) setResult(res);
      addRecord({ tool: "paper-writer", type: currentSection.label, input: researchInfo.slice(0, 200), result: res || result });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/markdown" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `paper-${section}-${Date.now()}.md`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#EC4899]/10 flex items-center justify-center text-xl">✍️</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">论文写作辅助</h1>
            <p className="text-sm text-[var(--text-muted)]">AI 驱动 · 基于分析结果自动生成学术论文段落</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">粘贴研究信息和分析结果 → 选择章节类型 → AI 生成规范的学术段落</p>
        <ActiveProviderBadge className="mb-6" />

        {!hasAnyKey() && (
          <div className="glass-card p-4 mb-6 border-[var(--warning)]/30">
            <p className="text-sm text-[var(--warning)]">⚠️ 尚未配置 API Key。<Link href="/settings" className="underline ml-1">前往设置</Link></p>
          </div>
        )}

        {/* Section selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => { setSection(s.id); setResult(""); }}
              className={cn("px-3 py-1.5 rounded-full text-sm border transition-colors",
                section === s.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
              )}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">研究信息（研究问题、方法、样本等）</label>
              <Textarea rows={6} value={researchInfo} onChange={(e) => setResearchInfo(e.target.value)}
                placeholder={"例：\n研究问题：社交媒体营销对消费者购买意愿的影响\n方法：问卷调查，Likert 7 级量表\n样本：300 名 18-35 岁消费者\n分析方法：SEM 结构方程模型"}
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">分析结果（粘贴统计输出，可选）</label>
              <Textarea rows={6} value={analysisResults} onChange={(e) => setAnalysisResults(e.target.value)}
                placeholder={"例：\nt(298) = 3.45, p < .001, d = 0.40\nβ = 0.35, SE = 0.08, p < .001\nR² = 0.28, F(3, 296) = 38.7, p < .001"}
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none font-mono text-sm" />
            </div>
            <Button onClick={handleGenerate} disabled={loading || !researchInfo.trim() || !hasAnyKey()}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 生成中...</> : <><PenTool className="w-4 h-4 mr-2" /> 生成 {SECTIONS.find((s) => s.id === section)?.label}</>}
            </Button>
            <HistoryPanel tool="paper-writer" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">生成结果</label>
              {result && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleDownload}>
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="glass-card p-6 min-h-[400px] max-h-[700px] overflow-y-auto">
              {error ? (
                <div className="text-[var(--error)] text-sm">{error}</div>
              ) : result ? (
                <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{result}</pre>
              ) : (
                <div className="text-[var(--text-muted)] text-sm text-center py-20">
                  <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>选择章节类型，输入研究信息</p>
                  <p className="text-xs mt-1">AI 将生成规范的学术论文段落</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
