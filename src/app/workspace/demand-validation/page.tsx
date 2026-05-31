"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, Download, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { cn } from "@/lib/utils";

type Mode = "idea-validate" | "pmf-score" | "market-size" | "pricing";

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "idea-validate", label: "创意验证", desc: "多维度评估产品创意的可行性" },
  { id: "pmf-score", label: "PMF 评分", desc: "产品市场契合度评估（基于 Ripple 方法论）" },
  { id: "market-size", label: "市场规模", desc: "TAM/SAM/SOM 估算 + 增长趋势" },
  { id: "pricing", label: "定价策略", desc: "竞品定价对比 + 价格弹性分析" },
];

export default function DemandValidationPage() {
  const [mode, setMode] = useState<Mode>("idea-validate");
  const [idea, setIdea] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const PROMPTS: Record<Mode, string> = {
    "idea-validate": `你是一个创业顾问和市场研究专家。请对以下产品创意进行多维度验证：

产品创意：${idea}
目标市场：${targetMarket || "未指定"}

请从以下维度评估（每项 0-100 分）：
1. 需求真实性 - 是否解决真实痛点？
2. 市场时机 - 现在是进入的好时机吗？
3. 竞争格局 - 竞争激烈度如何？
4. 技术可行性 - 技术实现难度
5. 商业模式 - 变现路径是否清晰？
6. 增长潜力 - 规模化可能性

输出 JSON：
{
  "idea_summary": "...",
  "overall_score": 0-100,
  "verdict": "强烈推荐/谨慎推荐/需要验证/不建议",
  "dimensions": [{ "name": "...", "score": 0-100, "analysis": "...", "evidence": "..." }],
  "swot": { "strengths": [...], "weaknesses": [...], "opportunities": [...], "threats": [...] },
  "validation_experiments": ["可执行的验证实验1", "..."],
  "next_steps": ["..."]
}`,

    "pmf-score": `你是 Ripple PMF 验证引擎。基于以下产品信息，模拟 8 个渠道的消费者反应：

产品：${idea}
目标市场：${targetMarket || "未指定"}

渠道（按传播机制分类）：
1. 算法推荐电商（抖音电商）
2. 搜索电商（天猫/京东）
3. 社交电商（微信小程序）
4. 内容种草（小红书）
5. 线下体验零售
6. 线下流通零售
7. 企业级销售
8. 应用商店

对每个渠道评估：认知期→试用期→增长期→成熟期的渗透路径

输出 JSON：
{
  "product": "${idea}",
  "pmf_score": 0-100,
  "pmf_grade": "A/B/C/D/F",
  "channels": [{ "name": "...", "fit_score": 0-100, "mechanism": "...", "expected_cac": "...", "expected_ltv": "...", "recommendation": "..." }],
  "consumer_panel": { "interested_pct": 0-100, "willing_to_pay_pct": 0-100, "top_concerns": [...], "top_motivators": [...] },
  "tribunal_verdict": { "market_analyst": "...", "user_advocate": "...", "devils_advocate": "..." },
  "improvements": ["..."],
  "go_to_market": ["..."]
}`,

    "market-size": `你是一个市场分析师。估算以下产品的市场规模：

产品：${idea}
目标市场：${targetMarket || "全球"}

输出 JSON：
{
  "product": "${idea}",
  "tam": { "size": "...", "description": "...", "sources": "..." },
  "sam": { "size": "...", "description": "...", "calculation": "..." },
  "som": { "size": "...", "description": "...", "assumptions": "..." },
  "growth_rate": "...",
  "market_trends": ["..."],
  "key_players": ["..."],
  "entry_barriers": ["..."],
  "recommendation": "..."
}`,

    "pricing": `你是一个定价策略专家。为以下产品制定定价方案：

产品：${idea}
目标市场：${targetMarket || "未指定"}
价格区间参考：${priceRange || "未指定"}

输出 JSON：
{
  "product": "${idea}",
  "competitor_pricing": [{ "competitor": "...", "price": "...", "positioning": "..." }],
  "pricing_strategies": [
    { "strategy": "渗透定价", "price": "...", "pros": "...", "cons": "...", "best_for": "..." },
    { "strategy": "撇脂定价", "price": "...", "pros": "...", "cons": "...", "best_for": "..." },
    { "strategy": "价值定价", "price": "...", "pros": "...", "cons": "...", "best_for": "..." }
  ],
  "recommended_price": "...",
  "recommended_strategy": "...",
  "rationale": "...",
  "price_elasticity_insight": "...",
  "a_b_test_suggestion": "..."
}`,
  };

  const handleRun = async () => {
    if (!idea.trim() || !hasAnyKey()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: "你是一个专业的市场研究和创业顾问。输出严格 JSON 格式。所有评分基于行业基准，不要过度乐观。" },
          { role: "user", content: PROMPTS[mode] },
        ],
        temperature: 0.3,
        maxTokens: 3000,
        stream: true,
        onChunk: (text) => setResult((prev) => prev + text),
      });
      if (!result) setResult(res);
      addRecord({ tool: "demand-validation", type: MODES.find((m) => m.id === mode)!.label, input: idea, result: res || result });
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
          <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center text-xl">✅</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">需求验证</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 IdeaScan · MK-Intel · Ripple PMF 方法论</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">输入产品创意，AI 从多维度验证需求真实性、市场时机和 PMF 契合度</p>

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
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">产品/创业创意</label>
              <Textarea rows={5} value={idea} onChange={(e) => setIdea(e.target.value)}
                placeholder="详细描述你的产品创意，例如：&#10;一款 AI 驱动的社媒内容生成工具，帮助中小商家自动生成小红书/抖音图文和短视频脚本，月费 ¥99..."
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">目标市场（可选）</label>
              <Input value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)}
                placeholder="例如：中国一二线城市中小商家、Z世代消费者..."
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
            </div>
            {mode === "pricing" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">价格区间参考（可选）</label>
                <Input value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                  placeholder="例如：¥49-199/月"
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
              </div>
            )}

            <Button onClick={handleRun} disabled={loading || !idea.trim() || !hasAnyKey()}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 验证中...</> : <><Play className="w-4 h-4 mr-2" /> 开始验证</>}
            </Button>

            <HistoryPanel tool="demand-validation" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">验证结果</label>
              {result && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                  const blob = new Blob([result], { type: "text/markdown" }); const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `validation-${mode}-${Date.now()}.md`; a.click();
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
                  <Target className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>输入产品创意，选择验证模式</p>
                  <p className="text-xs mt-1">AI 将从多维度评估你的创意可行性</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
