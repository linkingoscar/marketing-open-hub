"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, ArrowRight, BookOpen, Beaker } from "lucide-react";
import { MARKETING_TEMPLATES, TEMPLATE_CATEGORIES, type MarketingTemplate } from "@/data/marketing-templates";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  onSelect: (template: MarketingTemplate) => void;
  className?: string;
}

export function TemplateSelector({ onSelect, className }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = MARKETING_TEMPLATES.filter((t) => {
    const matchCategory = !selectedCategory || t.category === selectedCategory;
    const matchSearch = !searchQuery || t.nameCN.includes(searchQuery) || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.scenario.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索模板（如：品牌认知、A/B 测试、满意度）"
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs border transition-colors",
            !selectedCategory ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]/50"
          )}
        >
          全部
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs border transition-colors",
              selectedCategory === cat ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)] hover:border-[var(--primary)]/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-4 cursor-pointer group hover:border-[var(--primary)]/30 transition-all"
              onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{template.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{template.nameCN}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--primary)]/10 text-[var(--primary)]">{template.category}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{template.scenario}</p>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-[var(--text-muted)] transition-transform", expandedId === template.id && "rotate-90")} />
              </div>

              <AnimatePresence>
                {expandedId === template.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-3">
                      <p className="text-xs text-[var(--text-secondary)]">{template.description}</p>

                      {/* Recommended tests */}
                      <div>
                        <span className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-wider">推荐方法</span>
                        <div className="mt-1.5 space-y-1.5">
                          {template.recommendedTests.map((test) => (
                            <div key={test.testId} className="flex items-start gap-2">
                              <Beaker className="w-3 h-3 mt-0.5 text-[var(--primary)] shrink-0" />
                              <div>
                                <span className="text-xs font-medium text-[var(--text-primary)]">{test.testId}</span>
                                <span className="text-xs text-[var(--text-muted)] ml-1">— {test.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Data structure */}
                      <div>
                        <span className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-wider">数据结构</span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {template.sampleDataStructure.columns.slice(0, 6).map((col) => (
                            <span key={col.name} className="px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[10px] text-[var(--text-muted)] font-mono">
                              {col.name}
                            </span>
                          ))}
                          {template.sampleDataStructure.columns.length > 6 && (
                            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[10px] text-[var(--text-muted)]">
                              +{template.sampleDataStructure.columns.length - 6} 列
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Workflow */}
                      <div>
                        <span className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-wider">推荐流程</span>
                        <div className="mt-1.5 space-y-1">
                          {template.workflow.map((step) => (
                            <div key={step.step} className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[9px] font-bold text-[var(--primary)]">{step.step}</span>
                              <span className="text-xs text-[var(--text-secondary)]">{step.action}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* References */}
                      <div>
                        <span className="text-[10px] font-medium text-[var(--accent)] uppercase tracking-wider">参考文献</span>
                        <div className="mt-1.5 space-y-1">
                          {template.references.map((ref, i) => (
                            <p key={i} className="text-[10px] text-[var(--text-muted)]">
                              {ref.authors} ({ref.year}). {ref.title}. <em>{ref.journal}</em>.
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect(template); }}
                        className="w-full mt-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-3 h-3" />
                        使用此模板开始分析
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">未找到匹配的模板</p>
        </div>
      )}
    </div>
  );
}
