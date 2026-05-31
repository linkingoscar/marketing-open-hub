"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DistributionChartProps {
  data: number[];
  title?: string;
  bins?: number;
  color?: string;
}

export function DistributionChart({ data, title = "数据分布", bins = 10, color = "#6366F1" }: DistributionChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins || 1;
    const counts: { range: string; count: number; x: number }[] = [];
    for (let i = 0; i < bins; i++) {
      const low = min + i * binWidth;
      const high = low + binWidth;
      const count = data.filter((v) => v >= low && (i === bins - 1 ? v <= high : v < high)).length;
      counts.push({ range: `${low.toFixed(1)}`, count, x: (low + high) / 2 });
    }
    return counts;
  }, [data, bins]);

  return (
    <div className="w-full">
      {title && <p className="text-xs text-[var(--text-muted)] mb-2">{title}</p>}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="range" tick={{ fill: "#64748B", fontSize: 10 }} angle={-45} textAnchor="end" height={40} />
          <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#94A3B8" }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={color} fillOpacity={0.6 + (i / bins) * 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
