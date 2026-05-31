"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Database, Rows3, Tag, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_DATASETS, generateSampleCSV, type SampleDataset } from "@/data/datasets";
import { cn } from "@/lib/utils";

export default function DatasetsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const categories = ["all", ...new Set(SAMPLE_DATASETS.map((d) => d.category))];

  const filtered = selectedCategory === "all"
    ? SAMPLE_DATASETS
    : SAMPLE_DATASETS.filter((d) => d.category === selectedCategory);

  const handleDownload = (dataset: SampleDataset) => {
    const csv = generateSampleCSV(dataset);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${dataset.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-xl">📦</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">数据集市场</h1>
            <p className="text-sm text-[var(--text-muted)]">内置公开数据集，一键加载开始分析</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">选择适合你研究场景的数据集，下载后直接上传到分析工具使用</p>

        <div className="flex gap-2 mb-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={cn("px-3 py-1.5 rounded-full text-xs border transition-colors capitalize",
                selectedCategory === cat ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
              )}>
              {cat === "all" ? "全部" : cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((dataset, i) => (
            <motion.div key={dataset.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-semibold text-[var(--text-primary)]">{dataset.nameCN}</h3>
                </div>
                <Badge variant="outline" className="text-[10px]">{dataset.category}</Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{dataset.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Rows3 className="w-3 h-3" /> {dataset.rows} 行
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Tag className="w-3 h-3" /> {dataset.columns.length} 列
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <BookOpen className="w-3 h-3" /> {dataset.source}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {dataset.columns.slice(0, 6).map((col) => (
                  <span key={col} className="text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] font-mono">{col}</span>
                ))}
                {dataset.columns.length > 6 && (
                  <span className="text-[9px] px-1.5 py-0.5 text-[var(--text-muted)]">+{dataset.columns.length - 6}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">{dataset.useCase}</span>
                <Button size="sm" onClick={() => handleDownload(dataset)}
                  className="h-7 px-3 bg-[var(--primary)] text-white text-xs hover:opacity-90">
                  <Download className="w-3 h-3 mr-1" /> 下载 CSV
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
