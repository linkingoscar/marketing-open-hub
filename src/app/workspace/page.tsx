"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Settings, Key, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { projects } from "@/data/projects";
import { categories, getCategoryById } from "@/data/categories";
import { useAPIStore } from "@/lib/api/config";
import { ResearchGuide } from "@/components/workspace/research-guide";
import { cn } from "@/lib/utils";

// Map project IDs to their workspace tool page routes
function getToolRoute(projectId: string): string | null {
  const routes: Record<string, string> = {
    // Sentiment analysis tools → /workspace/sentiment
    "sentique": "/workspace/sentiment",
    "customer-insight": "/workspace/sentiment",
    "bertopic": "/workspace/sentiment",
    "amazon-behavior-analyzer": "/workspace/sentiment",
    "sentiment-research-report": "/workspace/sentiment",
    "google-social-pulse": "/workspace/sentiment",
    "social-pulse": "/workspace/sentiment",
    "amazon-reviews-analytics": "/workspace/sentiment",
    // AI simulation tools → /workspace/synthetic-research
    "synthetic-market-research": "/workspace/synthetic-research",
    "microcrowd": "/workspace/synthetic-research",
    "tunnel": "/workspace/synthetic-research",
    "dowhy": "/workspace/synthetic-research",
    // User behavior → /workspace/user-behavior
    "zengrowth": "/workspace/user-behavior",
    "istari": "/workspace/user-behavior",
    "ecommerce-consumer-analysis": "/workspace/user-behavior",
    // Marketing mix / Causal → /workspace/causal
    "pymc-marketing": "/workspace/causal",
    "meridian": "/workspace/causal",
    "oransim": "/workspace/causal",
    "econml": "/workspace/causal",
    "scikit-uplift": "/workspace/causal",
    "tfcausalimpact": "/workspace/causal",
    // CLV → /workspace/clv
    "lifetimes": "/workspace/clv",
    // Paper writing / polish
    "humanize-academic-writing": "/workspace/writing-polish",
    // Social media → /workspace/sentiment
    "ripple": "/workspace/empirical",
    "intelligence": "/workspace/sentiment",
    "taste-analytics": "/workspace/sentiment",
    "causalml": "/workspace/causal",
    // Brand monitoring → /workspace/brand-monitoring
    "geo-insight": "/workspace/brand-monitoring",
    // Demand validation → /workspace/demand-validation
    "ideacan": "/workspace/demand-validation",
    "mk-intel": "/workspace/demand-validation",
    // Statistics → /workspace/statistics
    "market-research-stats-toolkit": "/workspace/statistics",
    // CDP → /workspace/user-behavior
    "leo-cdp": "/workspace/user-behavior",
  };
  return routes[projectId] ?? null;
}

// All routes are now implemented — no catch-all needed

export default function WorkspacePage() {
  const { hasAnyKey } = useAPIStore();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = projects;
    if (selectedCat !== "all") list = list.filter((p) => p.category === selectedCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.descriptionCN.includes(q) || p.tags.some((t) => t.includes(q)));
    }
    return list;
  }, [search, selectedCat]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <span className="gradient-text">工作台</span>
        </h1>
        <p className="text-[var(--text-secondary)] mb-4">31 个开源项目与 18 个交互式工具，上传数据或输入内容直接开始分析</p>

        {/* API Status */}
        <div className={cn("glass-card p-4 mb-6 flex items-center justify-between", hasAnyKey() ? "border-[var(--success)]/20" : "border-[var(--warning)]/20")}>
          <div className="flex items-center gap-3">
            <Key className={cn("w-5 h-5", hasAnyKey() ? "text-[var(--success)]" : "text-[var(--warning)]")} />
            <span className="text-sm text-[var(--text-primary)]">
              {hasAnyKey() ? "API 已配置 — AI 工具可直接使用" : "未配置 API Key — 仅统计工具可用"}
            </span>
          </div>
          <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline">
            <Settings className="w-4 h-4" /> 设置
          </Link>
        </div>

        {/* Research Guide */}
        <div className="mb-6">
          <ResearchGuide />
        </div>

        {/* Quick access cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Link href="/workspace/templates"
            className="glass-card p-4 flex items-center gap-3 hover:border-[var(--primary)]/30 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-xl shrink-0">📋</div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">营销研究模板库</h3>
              <p className="text-xs text-[var(--text-muted)]">10 个预设场景</p>
            </div>
          </Link>
          <Link href="/workspace/workflow"
            className="glass-card p-4 flex items-center gap-3 hover:border-[var(--primary)]/30 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-xl shrink-0">🔄</div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">研究工作流</h3>
              <p className="text-xs text-[var(--text-muted)]">可视化流程编排</p>
            </div>
          </Link>
          <Link href="/workspace/literature"
            className="glass-card p-4 flex items-center gap-3 hover:border-[var(--primary)]/30 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-xl shrink-0">📚</div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">文献搜索</h3>
              <p className="text-xs text-[var(--text-muted)]">证据方向 + 结构化提取</p>
            </div>
          </Link>
          <Link href="/workspace/statistics"
            className="glass-card p-4 flex items-center gap-3 hover:border-[var(--primary)]/30 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#A855F7]/10 flex items-center justify-center text-xl shrink-0">🧮</div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">统计分析</h3>
              <p className="text-xs text-[var(--text-muted)]">36 种检验 + 结果注释</p>
            </div>
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input placeholder="搜索工具名称、描述、标签..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSelectedCat("all")}
              className={cn("shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors",
                selectedCat === "all" ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
              )}>全部</button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)}
                className={cn("shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap",
                  selectedCat === c.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
                )}>
                {c.icon} {c.nameCN}
              </button>
            ))}
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, index) => {
            const cat = getCategoryById(project.category);
            const catColor = cat?.color ?? "#6366F1";
            const route = getToolRoute(project.id);

            return (
              <motion.div key={project.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <a href={route ?? "/workspace"} className="glass-card p-5 flex flex-col h-full group cursor-pointer block">
                  <CardContent project={project} catColor={catColor} cat={cat} />
                </a>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <p className="text-lg">没有找到匹配的工具</p>
            <p className="text-sm mt-1">尝试其他搜索词或分类</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CardContent({ project, catColor, cat }: {
  project: typeof projects[0]; catColor: string; cat: ReturnType<typeof getCategoryById>;
}) {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: catColor }} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: `${catColor}15` }}>
            {project.icon}
          </div>
          <Badge variant="outline" className="text-[10px] border-[var(--success)]/30 text-[var(--success)]">可使用</Badge>
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary-light)] transition-colors">
          {project.name}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-3 line-clamp-2 flex-1">
          {project.descriptionCN}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border" style={{ borderColor: `${catColor}30`, color: catColor }}>{cat?.nameCN}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">{project.language}</span>
          {project.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
            打开工具 <ArrowRight className="w-3 h-3" />
          </div>
      </div>
    </>
  );
}
