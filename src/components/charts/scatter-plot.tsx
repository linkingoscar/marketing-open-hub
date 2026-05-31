"use client";

import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ScatterPlotProps {
  x: number[];
  y: number[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  showRegression?: boolean;
}

export function ScatterPlot({ x, y, xLabel = "X", yLabel = "Y", title, showRegression = true }: ScatterPlotProps) {
  const chartData = useMemo(() => x.map((xi, i) => ({ x: xi, y: y[i] })), [x, y]);

  const regressionLine = useMemo(() => {
    if (!showRegression || x.length < 3) return null;
    const n = x.length;
    const mx = x.reduce((s, v) => s + v, 0) / n;
    const my = y.reduce((s, v) => s + v, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (x[i] - mx) * (y[i] - my); den += (x[i] - mx) ** 2; }
    const slope = den > 0 ? num / den : 0;
    const intercept = my - slope * mx;
    const xMin = Math.min(...x), xMax = Math.max(...x);
    return [
      { x: xMin, y: slope * xMin + intercept },
      { x: xMax, y: slope * xMax + intercept },
    ];
  }, [x, y, showRegression]);

  return (
    <div className="w-full">
      {title && <p className="text-xs text-[var(--text-muted)] mb-2">{title}</p>}
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis type="number" dataKey="x" name={xLabel} tick={{ fill: "#64748B", fontSize: 10 }} label={{ value: xLabel, position: "insideBottom", offset: -15, style: { fill: "#94A3B8", fontSize: 11 } }} />
          <YAxis type="number" dataKey="y" name={yLabel} tick={{ fill: "#64748B", fontSize: 10 }} label={{ value: yLabel, angle: -90, position: "insideLeft", style: { fill: "#94A3B8", fontSize: 11 } }} />
          <Tooltip
            contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          />
          <Scatter data={chartData} fill="#6366F1" fillOpacity={0.6} r={4} />
          {regressionLine && (
            <Scatter data={regressionLine} line={{ stroke: "#F59E0B", strokeWidth: 2, strokeDasharray: "5 5" }} fill="transparent" r={0} />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
