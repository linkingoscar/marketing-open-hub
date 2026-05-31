/**
 * 项目健康度评分系统
 * 为 31 个开源项目提供多维评分
 */

export interface HealthScore {
  projectId: string;
  overall: number; // 0-100
  dimensions: {
    activity: number;      // 代码活跃度（最近提交/发布频率）
    community: number;     // 社区健康度（贡献者数量/响应时间）
    documentation: number; // 文档质量
    relevance: number;     // 营销研究相关度
    maintenance: number;   // 维护状态
  };
  status: "active" | "maintained" | "stale" | "archived";
  lastUpdate: string;
  contributors: number;
  openIssues: number;
  closedIssues: number;
  releaseFrequency: string; // e.g., "monthly", "quarterly", "yearly"
}

// Simulated health scores for the 31 projects
// In production, this would come from GitHub API
export const HEALTH_SCORES: Record<string, HealthScore> = {
  "sentique": {
    projectId: "sentique",
    overall: 85,
    dimensions: { activity: 90, community: 80, documentation: 85, relevance: 95, maintenance: 85 },
    status: "active",
    lastUpdate: "2026-05-28",
    contributors: 12,
    openIssues: 5,
    closedIssues: 47,
    releaseFrequency: "monthly",
  },
  "customer-insight": {
    projectId: "customer-insight",
    overall: 72,
    dimensions: { activity: 65, community: 70, documentation: 80, relevance: 90, maintenance: 70 },
    status: "maintained",
    lastUpdate: "2026-04-15",
    contributors: 8,
    openIssues: 12,
    closedIssues: 35,
    releaseFrequency: "quarterly",
  },
  "bertopic": {
    projectId: "bertopic",
    overall: 92,
    dimensions: { activity: 95, community: 90, documentation: 95, relevance: 85, maintenance: 95 },
    status: "active",
    lastUpdate: "2026-05-30",
    contributors: 45,
    openIssues: 18,
    closedIssues: 312,
    releaseFrequency: "monthly",
  },
  "pymc-marketing": {
    projectId: "pymc-marketing",
    overall: 88,
    dimensions: { activity: 85, community: 85, documentation: 90, relevance: 95, maintenance: 85 },
    status: "active",
    lastUpdate: "2026-05-25",
    contributors: 28,
    openIssues: 22,
    closedIssues: 156,
    releaseFrequency: "monthly",
  },
  "dowhy": {
    projectId: "dowhy",
    overall: 90,
    dimensions: { activity: 88, community: 92, documentation: 90, relevance: 85, maintenance: 90 },
    status: "active",
    lastUpdate: "2026-05-29",
    contributors: 65,
    openIssues: 30,
    closedIssues: 420,
    releaseFrequency: "monthly",
  },
  "zengrowth": {
    projectId: "zengrowth",
    overall: 68,
    dimensions: { activity: 60, community: 65, documentation: 75, relevance: 80, maintenance: 65 },
    status: "maintained",
    lastUpdate: "2026-03-20",
    contributors: 5,
    openIssues: 8,
    closedIssues: 22,
    releaseFrequency: "quarterly",
  },
  "lifetimes": {
    projectId: "lifetimes",
    overall: 55,
    dimensions: { activity: 40, community: 50, documentation: 70, relevance: 85, maintenance: 40 },
    status: "stale",
    lastUpdate: "2025-08-10",
    contributors: 15,
    openIssues: 25,
    closedIssues: 89,
    releaseFrequency: "yearly",
  },
  "meridian": {
    projectId: "meridian",
    overall: 82,
    dimensions: { activity: 80, community: 75, documentation: 85, relevance: 95, maintenance: 80 },
    status: "active",
    lastUpdate: "2026-05-20",
    contributors: 18,
    openIssues: 10,
    closedIssues: 78,
    releaseFrequency: "monthly",
  },
  "econml": {
    projectId: "econml",
    overall: 86,
    dimensions: { activity: 82, community: 88, documentation: 85, relevance: 85, maintenance: 88 },
    status: "active",
    lastUpdate: "2026-05-22",
    contributors: 35,
    openIssues: 15,
    closedIssues: 198,
    releaseFrequency: "monthly",
  },
  "scikit-uplift": {
    projectId: "scikit-uplift",
    overall: 78,
    dimensions: { activity: 75, community: 72, documentation: 80, relevance: 85, maintenance: 75 },
    status: "maintained",
    lastUpdate: "2026-04-28",
    contributors: 12,
    openIssues: 8,
    closedIssues: 65,
    releaseFrequency: "quarterly",
  },
};

/**
 * 获取项目健康度评分
 */
export function getHealthScore(projectId: string): HealthScore | null {
  return HEALTH_SCORES[projectId] ?? null;
}

/**
 * 获取健康度等级
 */
export function getHealthLevel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "优秀", color: "#10B981" };
  if (score >= 80) return { label: "良好", color: "#3B82F6" };
  if (score >= 70) return { label: "一般", color: "#F59E0B" };
  if (score >= 60) return { label: "较差", color: "#F97316" };
  return { label: "不活跃", color: "#EF4444" };
}

/**
 * 获取维护状态标签
 */
export function getStatusBadge(status: HealthScore["status"]): { label: string; color: string } {
  switch (status) {
    case "active": return { label: "活跃", color: "#10B981" };
    case "maintained": return { label: "维护中", color: "#3B82F6" };
    case "stale": return { label: "停滞", color: "#F59E0B" };
    case "archived": return { label: "归档", color: "#6B7280" };
  }
}
