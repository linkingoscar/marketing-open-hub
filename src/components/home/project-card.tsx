"use client";

import { motion } from "framer-motion";
import { Star, GitFork, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Project } from "@/data/types";
import { getCategoryColor } from "@/data/categories";
import { HealthBadgeCompact } from "@/components/workspace/health-badge";

function ScoreBar({ scores }: { scores: Project["scores"] }) {
  const avg = (scores.features + scores.easeOfUse + scores.documentation + scores.community + scores.performance) / 5;
  const pct = Math.round((avg / 10) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
      </div>
      <span className="text-xs font-mono text-[var(--text-tertiary)]">{avg.toFixed(1)}</span>
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const catColor = getCategoryColor(project.category);
  return (
    <motion.a href={`/project/${project.id}`}
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="glass-card p-5 flex flex-col h-full group cursor-pointer block">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: `${catColor}15` }}>{project.icon}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary-light)] transition-colors">{project.name}</h3>
          <p className="text-xs text-[var(--text-muted)] font-mono truncate">{project.fullName}</p>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-4 flex-1">{project.descriptionCN}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: `${catColor}40`, color: catColor }}>{project.language}</Badge>
        {project.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-[var(--border)] text-[var(--text-muted)]">{tag}</Badge>
        ))}
      </div>

      <div className="mb-4"><ScoreBar scores={project.scores} /></div>

      <div className="mb-3"><HealthBadgeCompact projectId={project.id} /></div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{project.stars >= 1000 ? `${(project.stars / 1000).toFixed(1)}k` : project.stars}</span>
          <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{project.forks}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
          详情 <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </motion.a>
  );
}
