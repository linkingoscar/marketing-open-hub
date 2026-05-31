"use client";

import { cn } from "@/lib/utils";
import { getHealthScore, getHealthLevel, getStatusBadge } from "@/lib/project-health";

interface HealthBadgeProps {
  projectId: string;
  className?: string;
  showDetails?: boolean;
}

export function HealthBadge({ projectId, className, showDetails = false }: HealthBadgeProps) {
  const score = getHealthScore(projectId);
  if (!score) return null;

  const level = getHealthLevel(score.overall);
  const status = getStatusBadge(score.status);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main badge */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: level.color }}
        >
          {score.overall}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: level.color }}>{level.label}</span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white"
              style={{ background: status.color }}
            >
              {status.label}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            {score.contributors} 贡献者 · {score.releaseFrequency} 更新
          </p>
        </div>
      </div>

      {/* Dimension details */}
      {showDetails && (
        <div className="space-y-1.5">
          {Object.entries(score.dimensions).map(([key, value]) => {
            const labels: Record<string, string> = {
              activity: "代码活跃度",
              community: "社区健康度",
              documentation: "文档质量",
              relevance: "研究相关度",
              maintenance: "维护状态",
            };
            const level = getHealthLevel(value);
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-muted)] w-16 shrink-0">{labels[key]}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, background: level.color }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] w-6 text-right">{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * 紧凑型健康度徽章（用于项目卡片）
 */
export function HealthBadgeCompact({ projectId, className }: { projectId: string; className?: string }) {
  const score = getHealthScore(projectId);
  if (!score) return null;

  const level = getHealthLevel(score.overall);
  const status = getStatusBadge(score.status);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
        style={{ background: level.color }}
      >
        {score.overall}
      </div>
      <span
        className="px-1 py-0.5 rounded text-[8px] font-medium text-white"
        style={{ background: status.color }}
      >
        {status.label}
      </span>
    </div>
  );
}
