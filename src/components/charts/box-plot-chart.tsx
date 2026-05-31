"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BoxPlotChartProps {
  groups: { label: string; data: number[] }[];
  title?: string;
}

function calcBoxStats(data: number[]) {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const whiskerLow = Math.max(sorted[0], q1 - 1.5 * iqr);
  const whiskerHigh = Math.min(sorted[n - 1], q3 + 1.5 * iqr);
  const mean = data.reduce((s, v) => s + v, 0) / n;
  const outliers = data.filter((v) => v < whiskerLow || v > whiskerHigh);
  return { q1, median, q3, whiskerLow, whiskerHigh, mean, outliers, min: sorted[0], max: sorted[n - 1] };
}

export function BoxPlotChart({ groups, title = "箱线图" }: BoxPlotChartProps) {
  const chartData = useMemo(() =>
    groups.map((g) => {
      const stats = calcBoxStats(g.data);
      return {
        label: g.label,
        min: stats.whiskerLow,
        q1: stats.q1,
        median: stats.median,
        q3: stats.q3,
        max: stats.whiskerHigh,
        mean: +stats.mean.toFixed(2),
        n: g.data.length,
      };
    }),
    [groups]
  );

  return (
    <div className="w-full">
      {title && <p className="text-xs text-[var(--text-muted)] mb-2">{title}</p>}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} />
          <YAxis dataKey="label" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} width={60} />
          <Tooltip
            contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="q3" fill="transparent" />
          <Bar dataKey="median" fill="#6366F1" radius={[0, 0, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill="#6366F1" fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Stats table below chart */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-1 px-2 text-[var(--text-muted)]">组</th>
              <th className="text-right py-1 px-2 text-[var(--text-muted)]">n</th>
              <th className="text-right py-1 px-2 text-[var(--text-muted)]">M</th>
              <th className="text-right py-1 px-2 text-[var(--text-muted)]">SD</th>
              <th className="text-right py-1 px-2 text-[var(--text-muted)]">Median</th>
              <th className="text-right py-1 px-2 text-[var(--text-muted)]">Q1</th>
              <th className="text-right py-1 px-2 text-[var(--text-muted)]">Q3</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((d, i) => {
              const g = groups[i];
              const sd = Math.sqrt(g.data.reduce((s, v) => s + (v - (d.mean)) ** 2, 0) / (g.data.length - 1));
              return (
                <tr key={i} className="border-b border-[var(--border)]">
                  <td className="py-1 px-2 text-[var(--text-primary)]">{d.label}</td>
                  <td className="text-right py-1 px-2 font-mono text-[var(--text-secondary)]">{d.n}</td>
                  <td className="text-right py-1 px-2 font-mono text-[var(--text-primary)]">{d.mean.toFixed(2)}</td>
                  <td className="text-right py-1 px-2 font-mono text-[var(--text-secondary)]">{sd.toFixed(2)}</td>
                  <td className="text-right py-1 px-2 font-mono text-[var(--text-secondary)]">{d.median.toFixed(2)}</td>
                  <td className="text-right py-1 px-2 font-mono text-[var(--text-secondary)]">{d.q1.toFixed(2)}</td>
                  <td className="text-right py-1 px-2 font-mono text-[var(--text-secondary)]">{d.q3.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
