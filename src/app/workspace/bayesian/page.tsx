"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Download, Copy, Check, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { cn } from "@/lib/utils";

const ANALYSIS_TYPES = [
  { id: "prior", label: "先验分布选择", desc: "根据研究设计推荐合适的先验分布", icon: "🎯" },
  { id: "posterior", label: "后验分析解读", desc: "解读后验分布、可信区间、收敛诊断", icon: "📊" },
  { id: "bayes-factor", label: "贝叶斯因子解释", desc: "解释 BF₁₀/BF₀₁ 含义和证据强度分级", icon: "⚖️" },
  { id: "model-comparison", label: "模型比较", desc: "贝叶斯模型选择、WAIC、LOO-CV", icon: "🔄" },
  { id: "sensitivity", label: "敏感性分析", desc: "先验敏感性检验、稳健性评估", icon: "🔍" },
  { id: "report", label: "贝叶斯报告撰写", desc: "生成符合期刊规范的贝叶斯分析结果段落", icon: "📝" },
];

export default function BayesianPage() {
  const [analysisType, setAnalysisType] = useState("prior");
  const [researchContext, setResearchContext] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const currentType = ANALYSIS_TYPES.find((t) => t.id === analysisType)!;

  const PROMPTS: Record<string, string> = {
    prior: `你是一位贝叶斯统计专家。根据以下研究场景，推荐合适的先验分布。
要求：
1. 推荐 2-3 种先验分布选项（弱信息先验、信息先验、参考先验）
2. 每种先验说明理由和适用场景
3. 提供 PyMC 代码示例
4. 中文撰写`,
    posterior: `你是一位贝叶斯统计专家。解读以下贝叶斯分析结果。
要求：
1. 解释后验分布的集中趋势和离散程度
2. 报告 95% 可信区间（Credible Interval）
3. 解释 HDI（最高密度区间）vs 等尾区间的区别
4. 收敛诊断（R-hat、ESS、trace plot 解读）
5. 中文撰写`,
    "bayes-factor": `你是一位贝叶斯统计专家。解释以下贝叶斯因子结果。
要求：
1. 解释 BF₁₀ 和 BF₀₁ 的含义
2. 使用 Jeffreys (1961) 证据强度分级
3. 与传统 p 值的对比
4. 对研究结论的影响
5. 中文撰写`,
    "model-comparison": `你是一位贝叶斯统计专家。进行贝叶斯模型比较分析。
要求：
1. 解释 WAIC 和 LOO-CV 指标
2. 模型权重和模型平均
3. 贝叶斯模型选择 vs 频率主义模型选择
4. 实际应用建议
5. 中文撰写`,
    sensitivity: `你是一位贝叶斯统计专家。进行先验敏感性分析。
要求：
1. 解释什么是先验敏感性
2. 如何检验后验对先验的敏感程度
3. 稳健先验的选择策略
4. 敏感性分析报告模板
5. 中文撰写`,
    report: `你是一位学术写作专家。根据以下贝叶斯分析结果，撰写符合期刊规范的结果段落。
要求：
1. 遵循 APA 格式
2. 报告后验均值、95% 可信区间、贝叶斯因子
3. 与传统频率主义结果对比（如适用）
4. 语言正式、客观
5. 中文撰写`,
  };

  const handleRun = async () => {
    if (!researchContext.trim() || !hasAnyKey()) return;
    setLoading(true);
    setError("");
    setResult("");

    const fullContext = `## 研究场景\n${researchContext}\n\n${dataDescription ? `## 数据/结果描述\n${dataDescription}` : ""}`;

    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: PROMPTS[analysisType] },
          { role: "user", content: fullContext },
        ],
        temperature: 0.3,
        maxTokens: 3000,
        stream: true,
        onChunk: (text) => setResult((prev) => prev + text),
      });
      if (!result) setResult(res);
      addRecord({ tool: "bayesian", type: currentType.label, input: researchContext.slice(0, 200), result: res || result });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/markdown" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `bayesian-${analysisType}-${Date.now()}.md`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#A855F7]/10 flex items-center justify-center text-xl">🧮</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">贝叶斯分析面板</h1>
            <p className="text-sm text-[var(--text-muted)]">LLM 引导式贝叶斯分析 · 先验选择 · 后验解读 · 模型比较</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">描述你的研究场景和数据 → 选择分析类型 → AI 生成贝叶斯分析指导和结果解读</p>
        <ActiveProviderBadge className="mb-6" />

        {!hasAnyKey() && (
          <div className="glass-card p-4 mb-6 border-[var(--warning)]/30">
            <p className="text-sm text-[var(--warning)]">⚠️ 尚未配置 API Key。<Link href="/settings" className="underline ml-1">前往设置</Link></p>
          </div>
        )}

        {/* Analysis type selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {ANALYSIS_TYPES.map((t) => (
            <button key={t.id} onClick={() => { setAnalysisType(t.id); setResult(""); }}
              className={cn("p-3 rounded-xl text-left border transition-all",
                analysisType === t.id ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card)]"
              )}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{t.label}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">{t.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">研究场景</label>
              <Textarea rows={5} value={researchContext} onChange={(e) => setResearchContext(e.target.value)}
                placeholder={"例：\n研究问题：品牌信任对购买意愿的影响\n方法：贝叶斯结构方程模型\n数据：300 份问卷，Likert 7 级量表\n已有信息：参考 Prior = Normal(0, 1) 的弱信息先验"}
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">数据/结果描述（可选）</label>
              <Textarea rows={4} value={dataDescription} onChange={(e) => setDataDescription(e.target.value)}
                placeholder={"例：\n后验均值 = 0.45, 95% CI [0.28, 0.62]\nR-hat = 1.01, ESS = 1200\nBF₁₀ = 15.3"}
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none font-mono text-sm" />
            </div>
            <Button onClick={handleRun} disabled={loading || !researchContext.trim() || !hasAnyKey()}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中...</> : <><Sparkles className="w-4 h-4 mr-2" /> 生成 {currentType.label}</>}
            </Button>
            <HistoryPanel tool="bayesian" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">分析结果</label>
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
              {error ? <div className="text-[var(--error)] text-sm">{error}</div> :
               result ? <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{result}</pre> :
               <div className="text-[var(--text-muted)] text-sm text-center py-20">
                 <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                 <p>选择分析类型，输入研究场景</p>
                 <p className="text-xs mt-1">AI 将生成贝叶斯分析指导和结果解读</p>
               </div>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
