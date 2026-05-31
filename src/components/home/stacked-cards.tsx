"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/data/projects";
import { getCategoryColor } from "@/data/categories";
import { Star, GitFork } from "lucide-react";
import { Badge } from "@/components/ui/badge";

gsap.registerPlugin(ScrollTrigger);

export function StackedCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const featured = projects.filter((p) => p.featured).slice(0, 5);

  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll(".stacked-card");
    if (cards.length === 0) return;

    const triggers: ScrollTrigger[] = [];
    cards.forEach((card, i) => {
      if (i === 0) return;
      const anim = gsap.fromTo(
        card,
        { y: 60 * i, scale: 1 - i * 0.04, opacity: 0.6 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `top+=${i * 120} center`,
            end: `top+=${(i + 1) * 120} center`,
            scrub: 1,
          },
        }
      );
      if (anim.scrollTrigger) triggers.push(anim.scrollTrigger);
    });

    return () => { triggers.forEach((t) => t.kill()); };
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
        <span className="gradient-text">精选推荐</span>
      </h2>
      <p className="text-[var(--text-secondary)] text-center mb-16 max-w-2xl mx-auto">
        滚动浏览，逐张展开每个精选项目
      </p>

      <div ref={sectionRef} className="relative" style={{ minHeight: `${featured.length * 200 + 400}px` }}>
        {featured.map((project, i) => {
          const catColor = getCategoryColor(project.category);
          const avgScore = (project.scores.features + project.scores.easeOfUse + project.scores.documentation + project.scores.community + project.scores.performance) / 5;
          return (
            <a
              key={project.id}
              href={`/project/${project.id}`}
              className="stacked-card sticky block p-6 sm:p-8 mb-6 border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
              style={{
                top: `${80 + i * 20}px`,
                zIndex: i + 1,
                background: "var(--bg-primary)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${catColor}15` }}>
                  {project.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">{project.name}</h3>
                       <p className="text-xs text-[var(--text-muted)] font-mono">{project.fullName}</p>
                    </div>
                    <span className="text-2xl font-bold gradient-text">{avgScore.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{project.descriptionCN}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" style={{ borderColor: `${catColor}40`, color: catColor }}>{project.language}</Badge>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                      <Star className="w-3 h-3 text-[var(--warm)] fill-[var(--warm)]" />
                      {project.stars >= 1000 ? `${(project.stars / 1000).toFixed(1)}k` : project.stars}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                      <GitFork className="w-3 h-3" />{project.forks}
                    </span>
                    {project.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] border-[var(--border)] text-[var(--text-muted)]">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
