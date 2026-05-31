"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, SortAsc, SortDesc, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { projects } from "@/data/projects";
import { getCategoryById, categories } from "@/data/categories";
import { ProjectCard } from "@/components/home/project-card";
import { cn } from "@/lib/utils";

type SortKey = "stars" | "name" | "updated" | "score";
type SortDir = "asc" | "desc";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const category = getCategoryById(slug);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("stars");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const categoryProjects = useMemo(() => {
    let filtered = projects.filter((p) => p.category === slug);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.descriptionCN.includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    if (langFilter !== "all") {
      filtered = filtered.filter((p) => p.language === langFilter);
    }
    filtered.sort((a, b) => {
      const dir = sortDir === "desc" ? -1 : 1;
      switch (sortBy) {
        case "stars": return dir * (a.stars - b.stars);
        case "name": return dir * a.name.localeCompare(b.name);
        case "updated": return dir * a.lastUpdated.localeCompare(b.lastUpdated);
        case "score": {
          const avgA = (a.scores.features + a.scores.easeOfUse + a.scores.documentation + a.scores.community + a.scores.performance) / 5;
          const avgB = (b.scores.features + b.scores.easeOfUse + b.scores.documentation + b.scores.community + b.scores.performance) / 5;
          return dir * (avgA - avgB);
        }
      }
    });
    return filtered;
  }, [slug, search, sortBy, sortDir, langFilter]);

  const languages = useMemo(() => {
    const langs = new Set(projects.filter((p) => p.category === slug).map((p) => p.language));
    return ["all", ...Array.from(langs)];
  }, [slug]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">分类未找到</h1>
          <Link href="/" className="text-[var(--primary)] hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{category.icon}</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{category.nameCN}</h1>
        </div>
        <p className="text-[var(--text-secondary)] max-w-2xl">{category.description}</p>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" style={{ borderColor: `${category.color}40`, color: category.color }}>{categoryProjects.length} 个项目</Badge>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Input placeholder="搜索项目..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Language filter */}
          <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)}
            className="h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
            {languages.map((l) => <option key={l} value={l}>{l === "all" ? "全部语言" : l}</option>)}
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
            <option value="stars">按 Stars</option>
            <option value="score">按评分</option>
            <option value="updated">按更新时间</option>
            <option value="name">按名称</option>
          </select>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-[var(--text-secondary)]"
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
            {sortDir === "desc" ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
          </Button>

          <Separator className="hidden sm:block h-6 bg-[var(--border)]" orientation="vertical" />

          <div className="flex items-center border border-[var(--border)] rounded-md">
            <button onClick={() => setView("grid")} className={cn("p-1.5", view === "grid" ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("p-1.5", view === "list" ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Other categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((c) => (
          <a key={c.id} href={`/category/${c.id}`}
            className={cn("shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors",
              c.id === slug ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]"
            )}>
            {c.icon} {c.nameCN}
          </a>
        ))}
      </div>

      {/* Project Grid */}
      {categoryProjects.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-tertiary)]">
          <p className="text-lg mb-2">没有找到匹配的项目</p>
          <p className="text-sm">尝试调整搜索条件</p>
        </div>
      ) : (
        <div className={cn(view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4")}>
          {categoryProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </div>
  );
}
