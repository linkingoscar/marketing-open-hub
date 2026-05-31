"use client";

import { useMemo } from "react";
import { Lightbulb, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  type: "recommend" | "warning" | "info";
  title: string;
  reason: string;
  suggestedTest?: string;
}

interface SmartSuggestProps {
  headers: string[];
  rows: Record<string, string | number>[];
  currentTest: string;
  onSuggest: (testId: string) => void;
}

function analyzeDataCharacteristics(headers: string[], rows: Record<string, string | number>[]) {
  const numCols = headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
  const catCols = headers.filter((h) => !numCols.includes(h) && rows.some((r) => r[h] !== null && r[h] !== undefined));
  const n = rows.length;

  // Check normality approximation (skewness)
  const skewnessValues: number[] = [];
  for (const col of numCols.slice(0, 5)) {
    const vals = rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");
    if (vals.length >= 3) {
      const m = vals.reduce((s, v) => s + v, 0) / vals.length;
      const sd = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1));
      if (sd > 0) {
        const skew = (vals.length / ((vals.length - 1) * (vals.length - 2))) * vals.reduce((s, v) => s + ((v - m) / sd) ** 3, 0);
        skewnessValues.push(Math.abs(skew));
      }
    }
  }
  const isNormal = skewnessValues.length > 0 ? skewnessValues.every((s) => s < 1) : true;
  const hasOutliers = skewnessValues.some((s) => s > 2);

  // Check group sizes
  const groupSizes: Record<string, number[]> = {};
  for (const col of catCols) {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const val = String(row[col] ?? "");
      counts[val] = (counts[val] || 0) + 1;
    }
    groupSizes[col] = Object.values(counts);
  }

  // Check if Likert scale (all values 1-5 or 1-7)
  const isLikert = numCols.length > 2 && numCols.every((col) => {
    const vals = rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");
    const min = Math.min(...vals), max = Math.max(...vals);
    return min >= 1 && max <= 7 && Number.isInteger(min) && Number.isInteger(max);
  });

  // Check paired data
  const hasPotentialPairs = numCols.length >= 2 && n >= 10;

  return { numCols, catCols, n, isNormal, hasOutliers, isLikert, groupSizes, hasPotentialPairs };
}

export function SmartSuggest({ headers, rows, currentTest, onSuggest }: SmartSuggestProps) {
  const suggestions = useMemo((): Suggestion[] => {
    const data = analyzeDataCharacteristics(headers, rows);
    const result: Suggestion[] = [];

    // Normality check
    if (!data.isNormal && (currentTest === "ttest" || currentTest === "anova")) {
      result.push({
        type: "warning",
        title: "数据分布偏态",
        reason: `检测到部分变量偏度 > 1，不满足正态性假设。`,
        suggestedTest: currentTest === "ttest" ? "mann-whitney" : "kruskal-wallis",
      });
    }

    // Likert scale recommendation
    if (data.isLikert && currentTest === "descriptive") {
      result.push({
        type: "recommend",
        title: "检测到 Likert 量表数据",
        reason: `数据为 1-7 级量表，建议先查看频率分布和信度分析。`,
        suggestedTest: "likert-freq",
      });
    }

    // Small sample warning
    if (data.n < 30 && (currentTest === "ttest" || currentTest === "regression")) {
      result.push({
        type: "warning",
        title: "样本量偏小",
        reason: `当前 N = ${data.n}，统计检验力可能不足。建议进行功效分析。`,
        suggestedTest: "power",
      });
    }

    // Multi-item scale detection
    if (data.numCols.length >= 3 && data.isLikert && currentTest !== "cronbach" && currentTest !== "item-analysis") {
      result.push({
        type: "recommend",
        title: "检测到多题项量表",
        reason: `发现 ${data.numCols.length} 个量表题项，建议先检验信度和效度。`,
        suggestedTest: "cronbach",
      });
    }

    // Paired data detection
    if (data.hasPotentialPairs && data.catCols.length === 0 && currentTest !== "paired-ttest" && currentTest !== "pearson") {
      result.push({
        type: "info",
        title: "多变量连续数据",
        reason: `检测到 ${data.numCols.length} 个连续变量，可进行相关分析或配对检验。`,
        suggestedTest: "pearson",
      });
    }

    // Group comparison suggestion
    if (data.catCols.length > 0 && data.numCols.length > 0) {
      const maxGroups = Math.max(...Object.values(data.groupSizes).map((v) => v.length));
      if (maxGroups === 2 && currentTest !== "ttest") {
        result.push({
          type: "recommend",
          title: "检测到二分组变量",
          reason: `分组变量有 2 个水平，适合独立样本 t 检验。`,
          suggestedTest: "ttest",
        });
      } else if (maxGroups > 2 && currentTest !== "anova") {
        result.push({
          type: "recommend",
          title: "检测到多水平分组",
          reason: `分组变量有 ${maxGroups} 个水平，适合单因素 ANOVA。`,
          suggestedTest: "anova",
        });
      }
    }

    // Always suggest data profile first
    if (currentTest === "descriptive" && result.length === 0) {
      result.push({
        type: "info",
        title: "数据概览",
        reason: `数据包含 ${data.n} 行 × ${headers.length} 列（${data.numCols.length} 数值 / ${data.catCols.length} 分类）。查看上方数据概览面板了解详情。`,
      });
    }

    // Missing value warning
    const missingPct = headers.reduce((s, h) => {
      const missing = rows.filter((r) => r[h] === null || r[h] === undefined || r[h] === "").length;
      return s + missing;
    }, 0) / (headers.length * rows.length) * 100;
    if (missingPct > 5) {
      result.push({
        type: "warning",
        title: `缺失率 ${missingPct.toFixed(1)}%`,
        reason: "数据缺失率较高，可能影响分析结果的可靠性。建议检查缺失机制。",
      });
    }

    return result;
  }, [headers, rows, currentTest]);

  if (suggestions.length === 0) return null;

  return (
    <div className="glass-card p-4 border-[var(--primary)]/10">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-[var(--warm)]" />
        <span className="text-xs font-medium text-[var(--warm)]">智能建议</span>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className={cn("flex items-start gap-2 p-2 rounded-lg text-xs",
            s.type === "warning" ? "bg-[var(--warning)]/5" :
            s.type === "recommend" ? "bg-[var(--primary)]/5" :
            "bg-[var(--bg-card)]"
          )}>
            {s.type === "warning" ? <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)] shrink-0 mt-0.5" /> :
             s.type === "recommend" ? <CheckCircle className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" /> :
             <Lightbulb className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-0.5" />}
            <div className="flex-1">
              <span className="font-medium text-[var(--text-primary)]">{s.title}</span>
              <p className="text-[var(--text-secondary)] mt-0.5">{s.reason}</p>
              {s.suggestedTest && (
                <button onClick={() => onSuggest(s.suggestedTest!)}
                  className="mt-1 inline-flex items-center gap-1 text-[var(--primary)] hover:underline">
                  切换到推荐检验 <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
