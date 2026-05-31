"use client";

import { motion } from "framer-motion";
import { TrendingUp, Star, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/data/projects";
import { getCategoryById } from "@/data/categories";

export function Trending() {
  const sorted = [...projects].sort((a, b) => b.stars - a.stars).slice(0, 8);
  const maxStars = sorted[0]?.stars ?? 1;

  return (
    <section id="trending" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="text-center mb-16">
        <div className="inline-flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--warm)]" />
          <h2 className="text-3xl sm:text-4xl font-bold">热门排行</h2>
        </div>
        <p className="text-[var(--text-secondary)]">按 GitHub Stars 排名，社区最受欢迎的项目</p>
      </motion.div>

      <div className="space-y-3">
        {sorted.map((project, index) => {
          const cat = getCategoryById(project.category);
          const pct = Math.round((project.stars / maxStars) * 100);
          return (
            <motion.a key={project.id} href={project.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
              className="glass-card p-4 flex items-center gap-4 group cursor-pointer block">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                index < 3 ? "bg-gradient-to-br from-[var(--warm)] to-[var(--primary)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
              }`}>{index + 1}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--primary-light)] transition-colors">{project.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: `${cat?.color ?? "#6366F1"}40`, color: cat?.color ?? "#6366F1" }}>{cat?.nameCN ?? project.category}</Badge>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{project.language}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:block w-24">
                  <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.6, delay: index * 0.06 }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--warm)] to-[var(--primary)]" />
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-mono text-[var(--text-secondary)] w-16 justify-end">
                  <Star className="w-3 h-3 text-[var(--warm)] fill-[var(--warm)]" />
                  {project.stars >= 1000 ? `${(project.stars / 1000).toFixed(1)}k` : project.stars}
                </span>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
