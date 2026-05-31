"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight, Lightbulb } from "lucide-react";

const STEPS = [
  { num: 1, title: "数据准备", desc: "清洗数据、处理缺失值、反向题编码", tool: "/workspace/data-clean", color: "#14B8A6" },
  { num: 2, title: "探索性分析", desc: "描述性统计、分布检验、相关矩阵", tool: "/workspace/statistics", color: "#A855F7" },
  { num: 3, title: "信效度检验", desc: "Cronbach's α、项目分析、EFA/CFA", tool: "/workspace/statistics", color: "#A855F7" },
  { num: 4, title: "假设检验", desc: "t 检验、ANOVA、回归分析", tool: "/workspace/statistics", color: "#A855F7" },
  { num: 5, title: "因果建模", desc: "中介/调节效应、SEM、Uplift", tool: "/workspace/empirical", color: "#6366F1" },
  { num: 6, title: "结果导出", desc: "APA 格式输出、图表导出、论文段落", tool: "/workspace/statistics", color: "#A855F7" },
];

export function ResearchGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card p-4 border-[var(--primary)]/10">
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left">
        <Lightbulb className="w-4 h-4 text-[var(--warm)]" />
        <span className="text-sm font-medium text-[var(--text-primary)]">研究流程指南</span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2">
          {STEPS.map((step) => (
            <a key={step.num} href={step.tool}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors group">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `${step.color}20`, color: step.color }}>
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary-light)] transition-colors">{step.title}</span>
                <p className="text-[10px] text-[var(--text-muted)]">{step.desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
