"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, X, Search, ArrowLeft, FlaskConical, BarChart3, MessageSquare, Users, TrendingUp, Target, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/data/projects";
import { getCategoryById, getCategoryColor } from "@/data/categories";
import { type Project } from "@/data/types";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts";

// ===== 场景定义 =====
interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  relevantTags: string[];
  relevantCategories: string[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "sentiment",
    name: "消费者情感分析",
    description: "分析消费者评论、社媒帖子的情感倾向，提取关键主题和情绪",
    icon: <MessageSquare className="w-5 h-5" />,
    relevantTags: ["sentiment", "nlp", "bert", "topic-modeling"],
    relevantCategories: ["sentiment-analysis", "brand-monitoring"],
  },
  {
    id: "causal",
    name: "营销因果推断",
    description: "评估营销活动的真实增量效果，控制混杂因素",
    icon: <FlaskConical className="w-5 h-5" />,
    relevantTags: ["causal-inference", "uplift", "treatment-effect", "meta-learner"],
    relevantCategories: ["marketing-mix", "ai-simulation"],
  },
  {
    id: "user-behavior",
    name: "用户行为分析",
    description: "追踪用户行为路径，分析转化漏斗，识别关键驱动因素",
    icon: <Users className="w-5 h-5" />,
    relevantTags: ["user-analytics", "ga4", "conversion", "clv", "btyd"],
    relevantCategories: ["user-behavior", "customer-data-platform"],
  },
  {
    id: "social-media",
    name: "社媒趋势洞察",
    description: "追踪社交媒体内容趋势，预测传播走势，评估 KOL 影响力",
    icon: <TrendingUp className="w-5 h-5" />,
    relevantTags: ["trend-analysis", "content-propagation", "xiaohongshu", "douyin", "tiktok"],
    relevantCategories: ["social-media"],
  },
  {
    id: "brand",
    name: "品牌监测与可见性",
    description: "监测品牌在各平台的提及、情感和可见性，包括 AI 模型中的品牌表现",
    icon: <Target className="w-5 h-5" />,
    relevantTags: ["brand-visibility", "geo", "sentiment", "amazon"],
    relevantCategories: ["brand-monitoring"],
  },
  {
    id: "validation",
    name: "需求与创意验证",
    description: "验证产品创意、市场需求和商业假设，降低创业风险",
    icon: <CheckCircle className="w-5 h-5" />,
    relevantTags: ["idea-validation", "pmf", "survey", "synthetic-data"],
    relevantCategories: ["demand-validation", "ai-simulation"],
  },
  {
    id: "stats",
    name: "统计分析与建模",
    description: "问卷数据分析、A/B 测试评估、联合分析、结构方程建模",
    icon: <BarChart3 className="w-5 h-5" />,
    relevantTags: ["statistics", "conjoint", "maxdiff", "ab-testing", "mmm"],
    relevantCategories: ["statistics-toolkit", "marketing-mix"],
  },
];

const COLORS = ["#6366F1", "#06B6D4", "#F59E0B", "#EC4899", "#10B981"];

// ===== Tab type =====
type CompareTab = "scenario" | "manual";

// ===== Find relevant projects for a scenario =====
function findRelevantProjects(scenario: Scenario): Project[] {
  return projects.filter((p) => {
    // Match by category
    if (scenario.relevantCategories.includes(p.category)) return true;
    // Match by tags
    return p.tags.some((t) => scenario.relevantTags.includes(t));
  });
}

// ===== Scenario Comparison Panel =====
function ScenarioComparison() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const relevantProjects = useMemo(() => {
    if (!selectedScenario) return [];
    return findRelevantProjects(selectedScenario);
  }, [selectedScenario]);

  const compareProjects = useMemo(() => {
    return compareIds.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as Project[];
  }, [compareIds]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-6">
      {/* Scenario selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => {
              setSelectedScenario(scenario);
              setCompareIds([]);
            }}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedScenario?.id === scenario.id
                ? "border-[var(--primary)] bg-[var(--primary)]/10"
                : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card)]"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                selectedScenario?.id === scenario.id ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              }`}>
                {scenario.icon}
              </div>
              <h3 className="font-medium text-[var(--text-primary)]">{scenario.name}</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{scenario.description}</p>
          </button>
        ))}
      </div>

      {/* Relevant tools */}
      {selectedScenario && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {selectedScenario.name} — 相关工具 ({relevantProjects.length})
            </h3>
            {compareIds.length >= 2 && (
              <span className="text-sm text-[var(--primary)]">
                已选 {compareIds.length} 个，可对比
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relevantProjects.map((p) => {
              const cat = getCategoryById(p.category);
              const catColor = getCategoryColor(p.category);
              const isSelected = compareIds.includes(p.id);
              const avgScore = (p.scores.features + p.scores.easeOfUse + p.scores.documentation + p.scores.community + p.scores.performance) / 5;

              return (
                <button
                  key={p.id}
                  onClick={() => toggleCompare(p.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--primary)]/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: `${catColor}15` }}>
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[var(--text-primary)] text-sm">{p.name}</span>
                        <span className="text-xs font-mono text-[var(--text-muted)]">{avgScore.toFixed(1)}</span>
                        {isSelected && (
                          <span className="ml-auto w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">{p.descriptionCN}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: `${catColor}30`, color: catColor }}>
                          {cat?.nameCN}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                          ⭐ {p.stars >= 1000 ? `${(p.stars / 1000).toFixed(1)}k` : p.stars}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Comparison result */}
          {compareProjects.length >= 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 mt-8">
              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">能力雷达图</h4>
                <CompareRadar selected={compareProjects} />
              </div>
              <div className="glass-card p-6">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">详细对比</h4>
                <CompareTable selected={compareProjects} />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

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
  const [tab, setTab] = useState<CompareTab>("scenario");
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
        <p className="text-[var(--text-secondary)] mb-6">按研究场景推荐工具对比，或手动选择项目进行多维度分析</p>

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] mb-8 w-fit">
          <button
            onClick={() => setTab("scenario")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "scenario"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            🎯 场景对比
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "manual"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            🔧 手动对比
          </button>
        </div>

        {/* Tab content */}
        {tab === "scenario" ? (
          <ScenarioComparison />
        ) : (
          <>
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
          </>
        )}
      </motion.div>
    </div>
  );
}
