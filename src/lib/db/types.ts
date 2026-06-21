/**
 * 数据库 Schema 类型定义
 *
 * 用于未来接入 Supabase / Firebase / PostgreSQL 等后端
 * 当前使用 localStorage mock 实现，接口保持一致
 */

// ===== 用户相关 =====

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: "zh" | "en";
  theme: "dark" | "light" | "system";
  defaultProvider?: string;
  onboardingCompleted: boolean;
}

// ===== 收藏 =====

export interface Favorite {
  id: string;
  userId: string;
  projectId: string;
  createdAt: string;
  note?: string; // 用户备注
}

// ===== 分析历史 =====

export interface AnalysisRecord {
  id: string;
  userId: string;
  toolId: string;
  toolName: string;
  type: "statistical-test" | "sentiment-analysis" | "ai-analysis" | "literature-search" | "export";
  inputSummary: string; // 输入摘要（不存储原始数据）
  resultSummary: string; // 结果摘要
  metadata: Record<string, unknown>; // 工具特定的元数据
  createdAt: string;
}

// ===== API 配置 =====

export interface APIConfig {
  id: string;
  userId: string;
  provider: string;
  apiKeyEncrypted: string; // 加密后的 API Key
  model: string;
  isPreferred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface APIUsageRecord {
  id: string;
  userId: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyMs: number;
  createdAt: string;
}

// ===== 工作流 =====

export interface WorkflowRecord {
  id: string;
  userId: string;
  templateId?: string;
  name: string;
  description: string;
  steps: WorkflowStepRecord[];
  status: "draft" | "running" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepRecord {
  id: string;
  type: string;
  label: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: unknown;
  startedAt?: string;
  completedAt?: string;
}

// ===== 数据集 =====

export interface UserDataset {
  id: string;
  userId: string;
  name: string;
  description?: string;
  columns: DatasetColumn[];
  rowCount: number;
  storageKey: string; // S3 key or local reference
  createdAt: string;
  updatedAt: string;
}

export interface DatasetColumn {
  name: string;
  type: "number" | "string" | "boolean" | "date";
  nullable: boolean;
  uniqueValues?: number;
}

// ===== 项目数据（缓存） =====

export interface ProjectCache {
  id: string;
  fullName: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  fetchedAt: string;
}
