"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, ArrowRight } from "lucide-react";
import { projects } from "@/data/projects";
import { getCategoryById } from "@/data/categories";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setOpen(false);
    router.push(path);
  }, [router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative mx-auto mt-[20vh] max-w-lg px-4" onClick={(e) => e.stopPropagation()}>
        <Command className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-[var(--shadow-lg)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 border-b border-[var(--border)]">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <Command.Input
              placeholder="搜索项目、技术栈、场景..."
              className="h-12 flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none text-sm"
              autoFocus
            />
            <kbd className="text-[10px] text-[var(--text-muted)] border border-[var(--border)] rounded px-1.5 py-0.5">ESC</kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
              没有找到匹配的项目
            </Command.Empty>

            {/* Categories */}
            <Command.Group heading="分类" className="mb-2">
              {["ai-simulation", "sentiment-analysis", "user-behavior", "marketing-mix", "social-media", "brand-monitoring", "demand-validation", "statistics-toolkit", "customer-data-platform"].map((catId) => {
                const cat = getCategoryById(catId);
                if (!cat) return null;
                return (
                  <Command.Item key={catId} value={cat.nameCN} onSelect={() => handleSelect(`/category/${catId}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] cursor-pointer data-[selected=true]:bg-[var(--bg-card-hover)] data-[selected=true]:text-[var(--text-primary)] transition-colors">
                    <span className="text-base">{cat.icon}</span>
                    <span className="flex-1">{cat.nameCN}</span>
                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Projects */}
            <Command.Group heading="项目">
              {projects.map((project) => {
                const cat = getCategoryById(project.category);
                return (
                  <Command.Item key={project.id} value={`${project.name} ${project.descriptionCN} ${project.tags.join(" ")}`}
                    onSelect={() => handleSelect(`/project/${project.id}`)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer data-[selected=true]:bg-[var(--bg-card-hover)] data-[selected=true]:text-[var(--text-primary)] transition-colors">
                    <span className="text-base">{project.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text-primary)] truncate">{project.name}</div>
                      <div className="text-xs text-[var(--text-muted)] truncate">{project.descriptionCN}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
                      style={{ borderColor: `${cat?.color ?? "#6366F1"}40`, color: cat?.color ?? "#6366F1" }}>
                      {cat?.nameCN}
                    </span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            <span>↑↓ 导航 · Enter 选择 · ESC 关闭</span>
            <span>{projects.length} 个项目</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
