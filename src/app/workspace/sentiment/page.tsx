"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, Copy, Check, Download, Upload, Sparkles, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { useHistoryStore } from "@/lib/api/history";
import { cn } from "@/lib/utils";

const ANALYSIS_TYPES = [
  { id: "sentiment", label: "情感分析", icon: "💬", prompt: "对以下文本进行情感分析，输出 JSON：{sentiment, score, emotions, aspects, summary, insights}" },
  { id: "theme", label: "主题提取", icon: "🏷️", prompt: "从以下文本中提取主要主题和话题，输出 JSON：{themes: [{name, frequency, keywords, sentiment}]}" },
  { id: "persona", label: "用户画像", icon: "👤", prompt: "根据以下消费者数据，生成用户画像，输出 JSON：{personas: [{name, age_range, occupation, pain_points, motivations, channels}]}" },
  { id: "competitor", label: "竞品分析", icon: "⚔️", prompt: "根据以下信息进行竞品分析，输出 JSON：{competitors: [{name, strengths, weaknesses, positioning}], gaps, recommendations}" },
  { id: "purchase-intent", label: "购买意向", icon: "🛒", prompt: "模拟 5 种消费者人格对产品的购买意向，输出 JSON：{personas: [{type, intent_score, concerns, likelihood, quote}]}" },
  { id: "custom", label: "自定义分析", icon: "🔧", prompt: "" },
];

export default function SentimentToolPage() {
  const [analysisType, setAnalysisType] = useState("sentiment");
  const [textInput, setTextInput] = useState("");
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [textColumn, setTextColumn] = useState("");
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const currentType = ANALYSIS_TYPES.find((t) => t.id === analysisType)!;

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    // Auto-detect text column
    const textCol = data.headers.find((h) =>
      /text|content|comment|review|message|body|描述|内容|评论|反馈|文本/i.test(h)
    ) ?? data.headers[0];
    setTextColumn(textCol);
    setTextInput("");
  };

  const handleRun = async () => {
    const hasFile = fileData && fileData.rows.length > 0;
    const hasText = textInput.trim().length > 0;
    if (!hasFile && !hasText) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      let dataContent = "";
      if (hasFile) {
        const col = textColumn || fileData!.headers[0];
        const texts = fileData!.rows.map((r, i) => `${i + 1}. ${String(r[col] ?? "")}`).filter((t) => t.length > 3);
        dataContent = `以下是 ${texts.length} 条数据（列名: ${col}）：\n\n${texts.join("\n")}`;
      } else {
        dataContent = textInput;
      }

      const systemPrompt = analysisType === "custom" ? customPrompt : currentType.prompt;
      if (!systemPrompt) { setError("请选择分析类型或输入自定义提示词"); setLoading(false); return; }

      const fullPrompt = `${systemPrompt}\n\n${hasFile ? `请对每条数据分别分析，最后给出汇总统计。` : ""}`;

      const res = await callLLM({
        messages: [
          { role: "system", content: fullPrompt },
          { role: "user", content: dataContent },
        ],
        temperature: 0.3,
        maxTokens: 4000,
        stream: true,
        onChunk: (text) => setResult((prev) => prev + text),
      });
      if (!result) setResult(res);
      addRecord({ tool: "sentiment", type: currentType.label, input: dataContent.slice(0, 500), result: res, fileName: fileData?.fileName });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const downloadResult = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analysis-${analysisType}-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };
  const downloadCSV = () => {
    if (!fileData) return;
    const csv = [fileData.headers.join(","), ...fileData.rows.map((r) => fileData.headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `data-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#EC4899]/10 flex items-center justify-center text-xl">💬</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">情感分析 / 消费者洞察</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 Sentique · CustomerInsight · Sentiment-Research-Report · Google Social Pulse</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">上传数据文件或粘贴文本，选择分析类型，AI 输出结构化结果</p>
        <ActiveProviderBadge className="mb-6" />

        {!hasAnyKey() && (
          <div className="glass-card p-4 mb-6 border-[var(--warning)]/30">
            <p className="text-sm text-[var(--warning)]">⚠️ 尚未配置 API Key。<Link href="/settings" className="underline ml-1">前往设置</Link></p>
          </div>
        )}

        {/* Analysis type selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ANALYSIS_TYPES.map((t) => (
            <button key={t.id} onClick={() => setAnalysisType(t.id)}
              className={cn("px-3 py-1.5 rounded-full text-sm border transition-colors",
                analysisType === t.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              )}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="text-sm text-[var(--text-tertiary)] mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" /> 上传数据文件
              </label>
              <FileUpload onUpload={handleFileUpload} description="支持 CSV / JSON / TSV，自动识别文本列" />
            </div>

            {/* File preview */}
            {fileData && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[var(--success)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{fileData.fileName}</span>
                    <Badge variant="outline" className="text-[10px] border-[var(--border)] text-[var(--text-muted)]">
                      {fileData.rowCount} 行 × {fileData.colCount} 列
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={downloadCSV}>
                    <Download className="w-3 h-3 mr-1" /> CSV
                  </Button>
                </div>

                {/* Column selector */}
                <div className="mb-3">
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">选择文本分析列</label>
                  <select value={textColumn} onChange={(e) => setTextColumn(e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                    {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Preview table */}
                <div className="overflow-x-auto max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        {fileData.headers.map((h) => (
                          <th key={h} className={cn("text-left py-1.5 px-2 text-[var(--text-muted)] font-medium", h === textColumn && "text-[var(--primary)]")}>
                            {h} {h === textColumn && "✦"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fileData.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border)]">
                          {fileData.headers.map((h) => (
                            <td key={h} className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[200px] truncate">{String(row[h] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {fileData.rows.length > 5 && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 text-center">... 还有 {fileData.rows.length - 5} 行</p>
                  )}
                </div>
              </div>
            )}

            {/* Text input fallback */}
            {!fileData && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">或直接粘贴文本</label>
                <Textarea rows={6} value={textInput} onChange={(e) => setTextInput(e.target.value)}
                  placeholder="粘贴评论、社媒帖子、用户反馈..."
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
              </div>
            )}

            {analysisType === "custom" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">自定义分析提示词</label>
                <Textarea rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="描述你想要的分析方式和输出格式..."
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
              </div>
            )}

            <Button onClick={handleRun} disabled={loading || (!textInput.trim() && !fileData) || !hasAnyKey()}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中...</> : <><Play className="w-4 h-4 mr-2" /> 开始分析</>}
            </Button>

            {/* History */}
            <HistoryPanel tool="sentiment" />
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">分析结果</label>
              {result && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyResult}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={downloadResult}>
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
                  <p>上传文件或粘贴文本，选择分析类型，点击“开始分析”</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
