"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Star, GitFork, Globe, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { projects } from "@/data/projects";
import { getCategoryById, getCategoryColor } from "@/data/categories";
import { ProjectCard } from "@/components/home/project-card";
import { HealthBadge } from "@/components/workspace/health-badge";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

function ScoreRadar({ scores }: { scores: { features: number; easeOfUse: number; documentation: number; community: number; performance: number } }) {
  const data = [
    { dimension: "功能", value: scores.features },
    { dimension: "易用性", value: scores.easeOfUse },
    { dimension: "文档", value: scores.documentation },
    { dimension: "社区", value: scores.community },
    { dimension: "性能", value: scores.performance },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(148, 163, 184, 0.3)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#94A3B8", fontSize: 13, fontWeight: 500 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: "#64748B", fontSize: 10 }} tickCount={6} />
        <Radar name="评分" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-tertiary)] w-12 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(value / 10) * 100}%` }} transition={{ duration: 0.6 }}
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
      </div>
      <span className="text-xs font-mono text-[var(--text-secondary)] w-6 text-right">{value}</span>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const project = projects.find((p) => p.id === id);

  const related = useMemo(() => {
    if (!project) return [];
    return projects.filter((p) => project.relatedProjects.includes(p.id)).slice(0, 3);
  }, [project]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">项目未找到</h1>
          <Link href="/" className="text-[var(--primary)] hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  const cat = getCategoryById(project.category);
  const catColor = getCategoryColor(project.category);
  const avgScore = (project.scores.features + project.scores.easeOfUse + project.scores.documentation + project.scores.community + project.scores.performance) / 5;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Back */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <a href={`/category/${project.category}`} className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回{cat?.nameCN ?? "分类"}
        </a>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${catColor}15` }}>{project.icon}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-1">{project.name}</h1>
            <p className="text-sm text-[var(--text-muted)] font-mono">{project.fullName}</p>
          </div>
        </div>

        <p className="text-[var(--text-secondary)] leading-relaxed mb-6 max-w-3xl">{project.descriptionCN}</p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <Star className="w-4 h-4 text-[var(--warm)] fill-[var(--warm)]" />
            {project.stars >= 1000 ? `${(project.stars / 1000).toFixed(1)}k` : project.stars}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <GitFork className="w-4 h-4" />{project.forks}
          </span>
          <Badge variant="outline" style={{ borderColor: `${catColor}40`, color: catColor }}>{project.language}</Badge>
          <Badge variant="outline" className="border-[var(--border)] text-[var(--text-muted)]">{project.license}</Badge>
          <Badge variant="outline" className="border-[var(--border)] text-[var(--text-muted)]">{cat?.nameCN}</Badge>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <a href={project.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <GitFork className="w-4 h-4" /> GitHub
          </a>
          {project.homepage && (
            <a href={project.homepage} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-card)] transition-colors">
              <Globe className="w-4 h-4" /> 官网
            </a>
          )}
        </div>

        {/* Health Score */}
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">项目健康度</h3>
          <HealthBadge projectId={project.id} showDetails />
        </div>
      </motion.div>

      <Separator className="mb-10 bg-[var(--border)]" />

      {/* Tags */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">标签</h2>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-[var(--border)] text-[var(--text-secondary)]">{tag}</Badge>
          ))}
        </div>
      </motion.div>

      {/* Scenarios */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">适用场景</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {project.scenarios.map((s) => (
            <div key={s} className="glass-card p-4 flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span className="text-sm text-[var(--text-secondary)]">{s}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scores */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">综合评分</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar */}
          <div className="glass-card p-6">
            <ScoreRadar scores={project.scores} />
          </div>
          {/* Bars */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">综合得分</span>
              <span className="text-2xl font-bold gradient-text">{avgScore.toFixed(1)}</span>
            </div>
            <ScoreBar label="功能" value={project.scores.features} />
            <ScoreBar label="易用性" value={project.scores.easeOfUse} />
            <ScoreBar label="文档" value={project.scores.documentation} />
            <ScoreBar label="社区" value={project.scores.community} />
            <ScoreBar label="性能" value={project.scores.performance} />
          </div>
        </div>
      </motion.div>

      {/* Description (original EN) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-10">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">项目简介</h2>
        <div className="glass-card p-6">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>
      </motion.div>

      {/* Related */}
      {related.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">相关项目</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </motion.div>
      )}
    </div>
  );
}
