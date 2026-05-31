"use client";

import { Lightbulb, AlertTriangle, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Annotation } from "@/lib/statistics/annotations";

interface AnnotationDisplayProps {
  annotation: Annotation;
  className?: string;
}

export function AnnotationDisplay({ annotation, className }: AnnotationDisplayProps) {
  return (
    <div className={cn("glass-card p-4 space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-medium text-[var(--accent)]">结果解读</span>
      </div>

      {/* One-liner */}
      <div className="p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
        <p className="text-sm font-medium text-[var(--text-primary)]">{annotation.oneLiner}</p>
      </div>

      {/* Plain explanation */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">通俗解释</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{annotation.plainExplanation}</p>
      </div>

      {/* Practical implication */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">实际意义</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{annotation.practicalImplication}</p>
      </div>

      {/* Action items */}
      {annotation.actionItems.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">建议下一步</span>
          </div>
          <ul className="space-y-1">
            {annotation.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                <span className="w-4 h-4 rounded-full bg-emerald-400/10 flex items-center justify-center text-[9px] font-bold text-emerald-400 shrink-0 mt-0.5">{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Caveats */}
      {annotation.caveats.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">注意事项</span>
          </div>
          <ul className="space-y-1">
            {annotation.caveats.map((caveat, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                <span className="text-amber-400 shrink-0">•</span>
                {caveat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
