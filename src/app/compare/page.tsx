"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, X, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { projects } from "@/data/projects";
import { getCategoryById, getCategoryColor } from "@/data/categories";
import { type Project } from "@/data/types";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#6366F1", "#06B6D4", "#F59E0B", "#EC4899", "#10B981"];

function CompareRadar({ selected }: { selected: Project[] }) {
  const dimensions = [
    { key: "features", label: "功能" },
    { key: "easeOfUse", label: "易用性" },
    { key: "documentation", label: "文档" },
    { key: "community", label: "社区" },
    { key: "performance", label: "性能" },
  ];

  const data = dimensions.map((dim) => {
    const row: Record<string, string | number> = { dimension: dim.label };
    selected.forEach((p) => {
      row[p.id] = p.scores[dim.key as keyof typeof p.scores];
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(148, 163, 184, 0.3)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#94A3B8", fontSize: 13, fontWeight: 500 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#64748B", fontSize: 10 }} tickCount={6} />
        {selected.map((p, i) => (
          <Radar key={p.id} name={p.name} dataKey={p.id} stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
        ))}
        <Legend wrapperStyle={{ fontSize: 13, color: "#94A3B8", paddingTop: 16 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function CompareTable({ selected }: { selected: Project[] }) {
  const rows = [
    { label: "语言", getValue: (p: Project) => p.language },
    { label: "Stars", getValue: (p: Project) => p.stars >= 1000 ? `${(p.stars / 1000).toFixed(1)}k` : String(p.stars) },
    { label: "Forks", getValue: (p: Project) => String(p.forks) },
    { label: "License", getValue: (p: Project) => p.license || "—" },
    { label: "分类", getValue: (p: Project) => getCategoryById(p.category)?.nameCN ?? p.category },
    { label: "功能评分", getValue: (p: Project) => String(p.scores.features) },
    { label: "易用性评分", getValue: (p: Project) => String(p.scores.easeOfUse) },
    { label: "文档评分", getValue: (p: Project) => String(p.scores.documentation) },
    { label: "社区评分", getValue: (p: Project) => String(p.scores.community) },
    { label: "性能评分", getValue: (p: Project) => String(p.scores.performance) },
    { label: "综合评分", getValue: (p: Project) => ((p.scores.features + p.scores.easeOfUse + p.scores.documentation + p.scores.community + p.scores.performance) / 5).toFixed(1) },
    { label: "AI 能力", getValue: (p: Project) => p.aiCapabilities.join(", ") || "—" },
    { label: "数据源", getValue: (p: Project) => p.dataSources.join(", ") || "—" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 px-4 text-[var(--text-tertiary)] font-medium w-32">维度</th>
            {selected.map((p) => (
              <th key={p.id} className="text-left py-3 px-4 text-[var(--text-primary)] font-medium">
                <div className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
              <td className="py-3 px-4 text-[var(--text-tertiary)]">{row.label}</td>
              {selected.map((p) => (
                <td key={p.id} className="py-3 px-4 text-[var(--text-secondary)]">{row.getValue(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const selected = useMemo(() => selectedIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as Project[], [selectedIds]);

  const searchResults = useMemo(() => {
    const available = projects.filter((p) => !selectedIds.includes(p.id));
    if (!search) return available.slice(0, 12);
    const q = search.toLowerCase();
    return available
      .filter((p) => p.name.toLowerCase().includes(q) || p.descriptionCN.includes(q) || p.tags.some((t) => t.includes(q)))
      .slice(0, 12);
  }, [search, selectedIds]);

  const addProject = (id: string) => {
    if (selectedIds.length >= 4) return;
    setSelectedIds((prev) => [...prev, id]);
    setSearch("");
  };

  const removeProject = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          项目<span className="gradient-text">对比</span>
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">选择最多 4 个项目进行多维度对比分析</p>

        {/* Search + Selected */}
        <div className="glass-card p-6 mb-8">
          {/* Selected chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map((p) => {
              const catColor = getCategoryColor(p.category);
              return (
                <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border"
                  style={{ borderColor: `${catColor}40`, background: `${catColor}10` }}>
                  <span>{p.icon}</span>
                  <span className="text-[var(--text-primary)]">{p.name}</span>
                  <button onClick={() => removeProject(p.id)} className="ml-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
            {selectedIds.length < 4 && (
              <span className="text-sm text-[var(--text-muted)] self-center">
                还可添加 {4 - selectedIds.length} 个项目
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input placeholder="搜索项目名称、描述、标签..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
          </div>

          {/* Project list */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">
                {search ? `搜索结果 (${searchResults.length})` : `全部项目 — 点击添加到对比 (${searchResults.length})`}
              </span>
              {selectedIds.length > 0 && (
                <span className="text-xs text-[var(--primary)]">{selectedIds.length}/4 已选</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {searchResults.map((p) => {
                const cat = getCategoryById(p.category);
                return (
                  <button key={p.id} onClick={() => addProject(p.id)}
                    className="flex items-center gap-3 px-4 py-3 text-left rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--primary)]/30 transition-all group">
                    <span className="text-lg shrink-0">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text-primary)] text-sm group-hover:text-[var(--primary-light)] transition-colors">{p.name}</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">{p.descriptionCN}</div>
                    </div>
                    <span className="text-xs shrink-0 px-1.5 py-0.5 rounded border"
                      style={{ borderColor: `${cat?.color ?? "#6366F1"}30`, color: cat?.color ?? "#6366F1" }}>
                      {cat?.nameCN}
                    </span>
                    <Plus className="w-4 h-4 text-[var(--text-muted)] shrink-0 group-hover:text-[var(--primary)]" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparison */}
        {selected.length >= 2 ? (
          <div className="space-y-8">
            {/* Radar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">能力雷达图</h2>
              <CompareRadar selected={selected} />
            </motion.div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">详细对比</h2>
              <CompareTable selected={selected} />
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-20 text-[var(--text-tertiary)]">
            <p className="text-lg mb-2">请至少选择 2 个项目开始对比</p>
            <p className="text-sm">在上方搜索框中搜索并添加项目</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
