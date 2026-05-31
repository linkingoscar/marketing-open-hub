"use client";

import { useMemo } from "react";
import { FileText, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DocxExport } from "./docx-export";
import { copyToClipboard } from "@/lib/utils";

interface ResultsExporterProps {
  testLabel: string;
  apa: {
    test: string;
    statistic: string;
    df?: string;
    p: string;
    effect?: string;
    ci?: string;
    conclusion: string;
    interpretation: string;
  };
  stats: Record<string, unknown>;
  charts?: string; // base64 chart image
}

export function ResultsExporter({ testLabel, apa, stats }: ResultsExporterProps) {
  const [copied, setCopied] = useState<"apa" | "table" | "results" | null>(null);

  const apaText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`${testLabel}`);
    lines.push(`${"─".repeat(40)}`);
    lines.push(`检验方法: ${apa.test}`);
    lines.push(`统计量: ${apa.statistic}`);
    if (apa.df) lines.push(`自由度: df = ${apa.df}`);
    lines.push(`显著性: p ${apa.p}`);
    if (apa.effect) lines.push(`效应量: ${apa.effect}`);
    if (apa.ci) lines.push(`置信区间: ${apa.ci}`);
    lines.push("");
    lines.push(`结论: ${apa.conclusion}`);
    return lines.join("\n");
  }, [testLabel, apa]);

  const tableText = useMemo(() => {
    const lines: string[] = [];
    lines.push(Object.keys(stats).join("\t"));
    lines.push(Object.values(stats).map((v) => typeof v === "object" ? JSON.stringify(v) : String(v)).join("\t"));
    return lines.join("\n");
  }, [stats]);

  const resultsParagraph = useMemo(() => {
    return apa.interpretation;
  }, [apa]);

  const handleCopy = async (type: "apa" | "table" | "results") => {
    const text = type === "apa" ? apaText : type === "table" ? tableText : resultsParagraph;
    await copyToClipboard(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    const full = `${apaText}\n\n${"═".repeat(40)}\n\n完整统计量\n${"─".repeat(40)}\n${tableText}\n\n${"═".repeat(40)}\n\n结果段落（可直接用于论文）\n${"─".repeat(40)}\n${resultsParagraph}`;
    const blob = new Blob([full], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stats-${testLabel.replace(/\s+/g, "-")}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--accent)]">一键导出</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleDownload}>
          <Download className="w-3 h-3 mr-1" /> 全部下载
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* APA Format */}
        <button onClick={() => handleCopy("apa")}
          className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card-hover)] transition-all text-left group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--text-primary)]">APA 格式</span>
            {copied === "apa" ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">{apa.statistic}</p>
          <span className="text-[9px] text-[var(--text-muted)] mt-1 block">点击复制到剪贴板</span>
        </button>

        {/* Stats Table */}
        <button onClick={() => handleCopy("table")}
          className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card-hover)] transition-all text-left group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--text-primary)]">统计量表格</span>
            {copied === "table" ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">{Object.keys(stats).length} 个统计量（制表符分隔）</p>
          <span className="text-[9px] text-[var(--text-muted)] mt-1 block">点击复制到剪贴板</span>
        </button>

        {/* Results Paragraph */}
        <button onClick={() => handleCopy("results")}
          className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card-hover)] transition-all text-left group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--text-primary)]">结果段落</span>
            {copied === "results" ? <Check className="w-3 h-3 text-[var(--success)]" /> : <Copy className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">可直接粘贴到论文“结果”部分</p>
          <span className="text-[9px] text-[var(--text-muted)] mt-1 block">点击复制到剪贴板</span>
        </button>

        {/* Docx Export */}
        <div className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card-hover)] transition-all text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[var(--text-primary)]">Word 文档</span>
            <DocxExport
              title={testLabel}
              sections={[
                { heading: "检验方法", content: apa.test },
                { heading: "统计结果", content: apa.statistic + (apa.effect ? `\n效应量: ${apa.effect}` : "") + (apa.ci ? `\n置信区间: ${apa.ci}` : "") },
                { heading: "结论", content: apa.conclusion },
                { heading: "详细解读", content: apa.interpretation },
                { heading: "统计量", content: Object.entries(stats).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n") },
              ]}
              filename={`${testLabel}-report`}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">下载 .html 格式报告（可用 Word 打开）</p>
        </div>
      </div>
    </div>
  );
}
