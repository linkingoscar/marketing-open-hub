"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DataProfileProps {
  headers: string[];
  rows: Record<string, string | number>[];
}

interface ColumnProfile {
  name: string;
  type: "numeric" | "categorical" | "mixed" | "empty";
  n: number;
  missing: number;
  missingPct: number;
  unique: number;
  sampleValues: string[];
  stats?: { mean?: number; sd?: number; min?: number; max?: number; median?: number; skewness?: number };
}

function analyzeColumn(name: string, rows: Record<string, string | number>[]): ColumnProfile {
  const values = rows.map((r) => r[name]);
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  const missing = values.length - nonNull.length;
  const numericVals = nonNull.filter((v): v is number => typeof v === "number");
  const stringVals = nonNull.filter((v) => typeof v === "string");

  let type: ColumnProfile["type"] = "empty";
  if (nonNull.length === 0) type = "empty";
  else if (numericVals.length > nonNull.length * 0.8) type = "numeric";
  else if (stringVals.length > nonNull.length * 0.8) type = "categorical";
  else type = "mixed";

  const unique = new Set(nonNull.map(String)).size;
  const sampleValues = [...new Set(nonNull.map(String))].slice(0, 5);

  const profile: ColumnProfile = {
    name, type, n: nonNull.length, missing,
    missingPct: values.length > 0 ? (missing / values.length) * 100 : 0,
    unique, sampleValues,
  };

  if (type === "numeric" && numericVals.length >= 2) {
    const m = numericVals.reduce((s, v) => s + v, 0) / numericVals.length;
    const sd = Math.sqrt(numericVals.reduce((s, v) => s + (v - m) ** 2, 0) / (numericVals.length - 1));
    const sorted = [...numericVals].sort((a, b) => a - b);
    const n = sorted.length;
    const skew = (n / ((n - 1) * (n - 2))) * numericVals.reduce((s, v) => s + ((v - m) / sd) ** 3, 0);
    profile.stats = {
      mean: +m.toFixed(2), sd: +sd.toFixed(2),
      min: sorted[0], max: sorted[n - 1],
      median: n % 2 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2,
      skewness: +skew.toFixed(2),
    };
  }

  return profile;
}

export function DataProfileDashboard({ headers, rows }: DataProfileProps) {
  const profiles = useMemo(() => headers.map((h) => analyzeColumn(h, rows)), [headers, rows]);
  const totalCells = headers.length * rows.length;
  const totalMissing = profiles.reduce((s, p) => s + p.missing, 0);
  const numericCols = profiles.filter((p) => p.type === "numeric").length;
  const catCols = profiles.filter((p) => p.type === "categorical").length;

  return (
    <div className="space-y-4">
      {/* Overview bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "总行数", value: rows.length, color: "#6366F1" },
          { label: "变量数", value: headers.length, color: "#06B6D4" },
          { label: "缺失率", value: `${totalCells > 0 ? ((totalMissing / totalCells) * 100).toFixed(1) : 0}%`, color: totalMissing > 0 ? "#F59E0B" : "#10B981" },
          { label: "数值/分类", value: `${numericCols}/${catCols}`, color: "#EC4899" },
        ].map((item) => (
          <div key={item.label} className="glass-card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Variable details */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-2 text-[var(--text-muted)] font-medium">变量名</th>
              <th className="text-center py-2 px-2 text-[var(--text-muted)] font-medium">类型</th>
              <th className="text-center py-2 px-2 text-[var(--text-muted)] font-medium">N</th>
              <th className="text-center py-2 px-2 text-[var(--text-muted)] font-medium">缺失</th>
              <th className="text-center py-2 px-2 text-[var(--text-muted)] font-medium">唯一值</th>
              <th className="text-center py-2 px-2 text-[var(--text-muted)] font-medium">均值</th>
              <th className="text-center py-2 px-2 text-[var(--text-muted)] font-medium">标准差</th>
              <th className="text-center py-2 px-2 text-[var(--text-muted)] font-medium">偏度</th>
              <th className="text-left py-2 px-2 text-[var(--text-muted)] font-medium">示例值</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.name} className="border-b border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
                <td className="py-2 px-2 text-[var(--text-primary)] font-medium">{p.name}</td>
                <td className="text-center py-2 px-2">
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0",
                    p.type === "numeric" ? "border-[#3B82F6]/40 text-[#3B82F6]" :
                    p.type === "categorical" ? "border-[#F59E0B]/40 text-[#F59E0B]" :
                    p.type === "mixed" ? "border-[#EC4899]/40 text-[#EC4899]" :
                    "border-[var(--border)] text-[var(--text-muted)]"
                  )}>
                    {p.type === "numeric" ? "连续" : p.type === "categorical" ? "分类" : p.type === "mixed" ? "混合" : "空"}
                  </Badge>
                </td>
                <td className="text-center py-2 px-2 font-mono text-[var(--text-secondary)]">{p.n}</td>
                <td className="text-center py-2 px-2">
                  <span className={cn("font-mono", p.missingPct > 10 ? "text-[var(--error)]" : p.missingPct > 0 ? "text-[var(--warning)]" : "text-[var(--text-muted)]")}>
                    {p.missing > 0 ? `${p.missing} (${p.missingPct.toFixed(1)}%)` : "—"}
                  </span>
                </td>
                <td className="text-center py-2 px-2 font-mono text-[var(--text-secondary)]">{p.unique}</td>
                <td className="text-center py-2 px-2 font-mono text-[var(--text-secondary)]">{p.stats?.mean ?? "—"}</td>
                <td className="text-center py-2 px-2 font-mono text-[var(--text-secondary)]">{p.stats?.sd ?? "—"}</td>
                <td className="text-center py-2 px-2 font-mono text-[var(--text-secondary)]">{p.stats?.skewness ?? "—"}</td>
                <td className="py-2 px-2 text-[var(--text-muted)] max-w-[200px] truncate">{p.sampleValues.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Missing value heatmap */}
      {totalMissing > 0 && (
        <div>
          <span className="text-xs text-[var(--text-muted)] mb-2 block">缺失值分布（前 50 行）</span>
          <div className="overflow-x-auto">
            <div className="flex gap-px" style={{ minWidth: headers.length * 12 }}>
              {headers.map((h) => (
                <div key={h} className="flex flex-col gap-px">
                  {rows.slice(0, 50).map((row, rowIdx) => {
                    const val = row[h];
                    const isMissing = val === null || val === undefined || val === "";
                    return (
                      <div key={rowIdx}
                        className={cn("w-2.5 h-2.5 rounded-sm", isMissing ? "bg-[var(--error)]/60" : "bg-[var(--success)]/20")}
                        title={`${h} 行${rowIdx + 1}: ${isMissing ? "缺失" : String(val).slice(0, 20)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
