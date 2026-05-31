"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Download, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { cn } from "@/lib/utils";

type PolishMode = "detect" | "rewrite" | "journal-adapt" | "voice-calibrate" | "section-polish";

const MODES: { id: PolishMode; label: string; icon: string; desc: string; needsInput: string }[] = [
  { id: "detect", label: "AI 痕迹检测", icon: "🔍", desc: "检测 30+ 种 AI 写作模式，不修改原文", needsInput: "粘贴你的论文段落" },
  { id: "rewrite", label: "智能润色", icon: "✨", desc: "检测 + 双 Pass 改写，去除 AI 痕迹", needsInput: "粘贴需要润色的段落" },
  { id: "journal-adapt", label: "期刊适配", icon: "📖", desc: "根据目标期刊风格调整写法", needsInput: "粘贴段落 + 指定目标期刊" },
  { id: "voice-calibrate", label: "风格校准", icon: "🎭", desc: "上传你过去的写作风格，AI 学习后按你的风格润色", needsInput: "粘贴你过去的论文段落作为风格样本" },
  { id: "section-polish", label: "逐节精修", icon: "📝", desc: "按 Introduction/Methods/Results/Discussion 的修辞结构精修", needsInput: "选择章节类型 + 粘贴内容" },
];

const AI_PATTERNS = [
  { tier: 1, label: "致命痕迹（英文）", color: "#EF4444", patterns: ["delve", "leverage", "tapestry", "landscape", "navigate", "foster", "robust", "pivotal", "transformative", "seamless", "nuanced"] },
  { tier: 1, label: "致命痕迹（中文）", color: "#EF4444", patterns: ["值得注意的是", "需要指出的是", "不言而喻", "毋庸置疑", "由此可见", "综上所述", "总而言之", "换言之", "具体而言", "在此基础上"] },
  { tier: 2, label: "可疑痕迹（英文）", color: "#F59E0B", patterns: ["moreover", "furthermore", "additionally", "in terms of", "it is important to note", "plays a crucial role", "serves as", "boasts"] },
  { tier: 2, label: "可疑痕迹（中文）", color: "#F59E0B", patterns: ["首先.*其次.*最后", "不仅.*而且", "一方面.*另一方面", "具有重要意义", "发挥着重要作用", "提供了新的视角", "为.*奠定了基础", "具有重要的理论和实践意义"] },
  { tier: 3, label: "弱信号", color: "#64748B", patterns: ["— (em dash clusters)", "rule of three", "hedge stacking", "copula avoidance", "synonym cycling", "过度使用排比句", "三段式并列"] },
];

const SECTION_MOVES: Record<string, { label: string; moves: string[] }> = {
  introduction: { label: "Introduction", moves: ["Stakes → 问题的重要性", "Problem Gap → 现有研究不足", "Key Abstraction → 核心抽象概念", "Design Intuition → 方法直觉", "Contribution → 贡献声明", "Results Preview → 结果预览"] },
  methods: { label: "Methods", moves: ["研究设计", "样本与数据收集", "变量测量", "分析方法", "伦理声明"] },
  results: { label: "Results", moves: ["描述性统计", "假设检验结果", "效应量与置信区间", "补充分析"] },
  discussion: { label: "Discussion", moves: ["主要发现解读", "与已有文献对比", "理论贡献", "实践启示", "研究局限", "未来方向"] },
};

export default function WritingPolishPage() {
  const [mode, setMode] = useState<PolishMode>("detect");
  const [textInput, setTextInput] = useState("");
  const [journalName, setJournalName] = useState("");
  const [sectionType, setSectionType] = useState("introduction");
  const [voiceSample, setVoiceSample] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const currentMode = MODES.find((m) => m.id === mode)!;

  const PROMPTS: Record<PolishMode, string> = {
    detect: `你是一个 AI 写作痕迹检测专家。分析以下文本，检测所有 AI 写作痕迹。

检测维度：
1. 词汇层面：空洞大词（delve, leverage, tapestry, robust, pivotal, transformative, seamless, nuanced）、同义词循环、模板短语
2. 句式层面：破折号滥用、三连排比、对冲堆叠（could potentially may）、避免使用"is/are"的写法
3. 结构层面：过度结构化（小标题过多）、节奏均匀（所有句子长度相近）、过渡词堆叠
4. 内容层面：空洞归因（"experts argue"）、虚假范围（"from X to Y"）、泛化修饰

输出 JSON：
{
  "score": 0-100（AI 概率）,
  "verdict": "human/mixed/ai",
  "issues": [
    {"tier": 1-3, "pattern": "模式名", "quote": "原文片段", "suggestion": "改写建议"}
  ],
  "summary": "一句话总结"
}`,

    rewrite: `你是一个学术写作润色专家。对以下文本进行双 Pass 润色。

第一 Pass：
- 删除所有空洞大词和模板短语
- 将被动语态改为主动语态（Methods 除外）
- 删除多余过渡词（moreover/furthermore/additionally → 直接删除或用"and"）
- 将对冲堆叠简化为单一表达
- 添加具体数据和引用替代泛化表述

第二 Pass：
- 检查第一 Pass 是否引入了新的 AI 痕迹
- 调整句子长度变化（短句+长句交替）
- 确保节奏自然（不是所有段落都一样长）

输出格式：
## 润色后文本
[完整润色后的文本]

## 改动摘要
[列出主要改动]`,

    "journal-adapt": `你是一个学术写作专家。根据目标期刊"${journalName}"的写作风格，修改以下段落。

修改原则：
1. 保持所有事实、数据、引用不变
2. 调整句式结构以匹配期刊风格
3. 调整过渡词和连接方式
4. 保持学术严谨性

输出格式：
## 适配后文本
[适配后的文本]

## 适配说明
[说明做了哪些调整以匹配期刊风格]`,

    "voice-calibrate": `你是一个写作风格分析专家。分析以下风格样本，提取写作风格特征，然后用这个风格润色目标文本。

风格样本：
${voiceSample}

提取维度：
1. 句式节奏（长短句比例）
2. 过渡词偏好
3. 用词习惯（正式/口语/技术）
4. 段落结构
5. 引用方式

然后用提取的风格润色以下文本。

输出格式：
## 风格特征
[提取的风格特征]

## 润色后文本
[按风格润色后的文本]`,

    "section-polish": `你是一个学术写作专家。按照 ${SECTION_MOVES[sectionType]?.label || sectionType} 章节的修辞结构，精修以下文本。

修辞动作序列：
${SECTION_MOVES[sectionType]?.moves.map((m, i) => `${i + 1}. ${m}`).join("\n") || "按标准学术结构精修"}

要求：
1. 确保每个修辞动作都有对应的段落
2. 调整段落顺序以匹配修辞结构
3. 强化论点-证据映射
4. 删除与章节功能无关的内容

输出格式：
## 精修后文本
[精修后的文本]

## 结构检查
[每个修辞动作的覆盖情况]`,

  };

  const handleRun = async () => {
    if (!textInput.trim() || !hasAnyKey()) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: PROMPTS[mode] },
          { role: "user", content: textInput },
        ],
        temperature: 0.3,
        maxTokens: 4000,
        stream: true,
        onChunk: (text) => setResult((prev) => prev + text),
      });
      if (!result) setResult(res);
      addRecord({ tool: "writing-polish", type: currentMode.label, input: textInput.slice(0, 200), result: res || result });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "处理失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/markdown" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `polish-${mode}-${Date.now()}.md`; a.click(); URL.revokeObjectURL(url);
  };

  // Quick pattern detection (client-side, no API needed)
  const quickDetect = () => {
    if (!textInput.trim()) return;
    const found: { tier: number; pattern: string; count: number }[] = [];
    for (const tier of AI_PATTERNS) {
      for (const pattern of tier.patterns) {
        if (pattern.startsWith("—") || pattern.startsWith("rule") || pattern.startsWith("hedge") || pattern.startsWith("copula") || pattern.startsWith("synonym") || pattern.startsWith("过度") || pattern.startsWith("三段")) continue;
        // Use word boundaries for English, plain match for Chinese/regex patterns
        const hasChinese = /[\u4e00-\u9fff]/.test(pattern);
        const regex = hasChinese ? new RegExp(pattern, "gi") : new RegExp(`\\b${pattern}\\b`, "gi");
        const matches = textInput.match(regex);
        if (matches && matches.length > 0) {
          found.push({ tier: tier.tier, pattern, count: matches.length });
        }
      }
    }
    if (found.length === 0) {
      setResult("✅ 快速扫描：未发现常见 AI 词汇痕迹。建议使用「智能润色」进行深度检测。");
    } else {
      const lines = found.map((f) => {
        const tierLabel = f.tier === 1 ? "🔴" : f.tier === 2 ? "🟡" : "⚪";
        return `${tierLabel} "${f.pattern}" — 出现 ${f.count} 次`;
      });
      setResult(`⚠️ 快速扫描发现 ${found.length} 种 AI 痕迹：\n\n${lines.join("\n")}\n\n建议使用「智能润色」进行完整检测和改写。`);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#EC4899]/10 flex items-center justify-center text-xl">✨</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">论文润色</h1>
            <p className="text-sm text-[var(--text-muted)]">AI 痕迹检测 · 智能改写 · 期刊适配 · 风格校准 · 逐节精修</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">粘贴你的论文段落 → 选择润色模式 → AI 检测并改写 → 复制润色结果</p>
        <ActiveProviderBadge className="mb-6" />

        {!hasAnyKey() && (
          <div className="glass-card p-4 mb-6 border-[var(--warning)]/30">
            <p className="text-sm text-[var(--warning)]">⚠️ 尚未配置 API Key。<a href="/settings" className="underline ml-1">前往设置</a></p>
          </div>
        )}

        {/* Mode selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setResult(""); }}
              className={cn("px-3 py-1.5 rounded-full text-sm border transition-colors",
                mode === m.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
              )}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            {mode === "journal-adapt" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">目标期刊</label>
                <Input value={journalName} onChange={(e) => setJournalName(e.target.value)}
                  placeholder="例如：Nature, Science, Journal of Marketing, 管理世界..."
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
              </div>
            )}

            {mode === "voice-calibrate" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">你的写作风格样本（粘贴你过去的论文段落）</label>
                <Textarea rows={4} value={voiceSample} onChange={(e) => setVoiceSample(e.target.value)}
                  placeholder="粘贴你过去写的论文段落，AI 会学习你的写作风格..."
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
              </div>
            )}

            {mode === "section-polish" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">章节类型</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SECTION_MOVES).map(([key, val]) => (
                    <button key={key} onClick={() => setSectionType(key)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors",
                        sectionType === key ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
                      )}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 block">{currentMode.needsInput}</label>
              <Textarea rows={10} value={textInput} onChange={(e) => setTextInput(e.target.value)}
                placeholder={currentMode.needsInput}
                className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRun} disabled={loading || !textInput.trim() || !hasAnyKey()}
                className="flex-1 h-11 bg-[var(--primary)] text-white hover:opacity-90">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 处理中...</> : <><Sparkles className="w-4 h-4 mr-2" /> {currentMode.label}</>}
              </Button>
              <Button variant="outline" onClick={quickDetect} disabled={!textInput.trim()}
                className="h-11 border-[var(--border)] text-[var(--text-secondary)]">
                🔍 快速扫描
              </Button>
            </div>

            {/* AI Patterns Reference */}
            <div className="glass-card p-4">
              <span className="text-xs text-[var(--text-muted)] mb-2 block">AI 写作痕迹参考</span>
              {AI_PATTERNS.map((tier) => (
                <div key={tier.tier} className="mb-2">
                  <span className="text-[10px] font-medium" style={{ color: tier.color }}>
                    {tier.tier === 1 ? "🔴 致命" : tier.tier === 2 ? "🟡 可疑" : "⚪ 弱信号"}：
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-1">{tier.patterns.join(", ")}</span>
                </div>
              ))}
            </div>

            <HistoryPanel tool="writing-polish" />
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">结果</label>
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
                 <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
                 <p>粘贴文本，选择模式，开始润色</p>
                 <p className="text-xs mt-1">或点击&ldquo;快速扫描&rdquo;进行即时 AI 痕迹检测</p>
               </div>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
