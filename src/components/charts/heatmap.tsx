"use client";

interface HeatmapProps {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  title?: string;
  min?: number;
  max?: number;
}

export function Heatmap({ matrix, rowLabels, colLabels, title, min = -1, max = 1 }: HeatmapProps) {
  const getColor = (value: number) => {
    const norm = (value - min) / (max - min);
    if (norm > 0.6) return `rgba(99, 102, 241, ${0.3 + norm * 0.7})`;
    if (norm > 0.4) return `rgba(148, 163, 184, ${0.2 + norm * 0.3})`;
    return `rgba(239, 68, 68, ${0.3 + (1 - norm) * 0.5})`;
  };

  const getTextColor = (value: number) => {
    const norm = (value - min) / (max - min);
    return norm > 0.3 && norm < 0.7 ? "#F1F5F9" : "#0F172A";
  };

  return (
    <div className="w-full">
      {title && <p className="text-xs text-[var(--text-muted)] mb-2">{title}</p>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${colLabels.length * 52 + 60}px` }}>
          <thead>
            <tr>
              <th className="w-14"></th>
              {colLabels.map((label, i) => (
                <th key={i} className="text-center py-1 px-1 text-[10px] text-[var(--text-muted)] font-medium" style={{ width: 52 }}>
                  {label.length > 6 ? label.slice(0, 5) + "…" : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="text-right py-1 px-2 text-[10px] text-[var(--text-muted)] font-medium whitespace-nowrap">
                  {rowLabels[i]?.length > 8 ? rowLabels[i].slice(0, 7) + "…" : rowLabels[i]}
                </td>
                {row.map((val, j) => (
                  <td key={j} className="text-center py-1 px-1">
                    <div
                      className="w-11 h-8 rounded flex items-center justify-center text-[10px] font-mono"
                      style={{ background: getColor(val), color: getTextColor(val) }}
                      title={`${rowLabels[i]} × ${colLabels[j]}: ${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Color legend */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-[10px] text-[var(--text-muted)]">{min.toFixed(1)}</span>
        <div className="w-32 h-2 rounded-full" style={{ background: `linear-gradient(to right, rgba(239,68,68,0.6), rgba(148,163,184,0.3), rgba(99,102,241,0.8))` }} />
        <span className="text-[10px] text-[var(--text-muted)]">{max.toFixed(1)}</span>
      </div>
    </div>
  );
}
