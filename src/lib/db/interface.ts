/**
 * 数据库接口定义
 *
 * 所有数据库操作的抽象接口
 * 当前使用 localStorage mock 实现
 * 未来可替换为 Supabase / Firebase / PostgreSQL 实现
 */

import type {
  UserProfile,
  Favorite,
  AnalysisRecord,
  APIConfig,
  APIUsageRecord,
  WorkflowRecord,
  UserDataset,
  ProjectCache,
} from "./types";

export interface DatabaseInterface {
  // ===== 用户 =====
  getUser(userId: string): Promise<UserProfile | null>;
  createUser(user: Omit<UserProfile, "createdAt" | "updatedAt">): Promise<UserProfile>;
  updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  deleteUser(userId: string): Promise<void>;

  // ===== 收藏 =====
  getFavorites(userId: string): Promise<Favorite[]>;
  addFavorite(userId: string, projectId: string, note?: string): Promise<Favorite>;
  removeFavorite(userId: string, projectId: string): Promise<void>;
  isFavorite(userId: string, projectId: string): Promise<boolean>;

  // ===== 分析历史 =====
  getAnalysisHistory(userId: string, limit?: number): Promise<AnalysisRecord[]>;
  addAnalysisRecord(record: Omit<AnalysisRecord, "id" | "createdAt">): Promise<AnalysisRecord>;
  deleteAnalysisRecord(recordId: string): Promise<void>;
  clearAnalysisHistory(userId: string): Promise<void>;

  // ===== API 配置 =====
  getAPIConfigs(userId: string): Promise<APIConfig[]>;
  saveAPIConfig(config: Omit<APIConfig, "id" | "createdAt" | "updatedAt">): Promise<APIConfig>;
  deleteAPIConfig(configId: string): Promise<void>;
  getPreferredConfig(userId: string): Promise<APIConfig | null>;

  // ===== API 使用量 =====
  getAPIUsage(userId: string, provider?: string): Promise<APIUsageRecord[]>;
  addAPIUsage(record: Omit<APIUsageRecord, "id" | "createdAt">): Promise<APIUsageRecord>;
  getUsageSummary(userId: string, days?: number): Promise<{
    totalRequests: number;
    totalTokens: number;
    estimatedCost: number;
  }>;

  // ===== 工作流 =====
  getWorkflows(userId: string): Promise<WorkflowRecord[]>;
  getWorkflow(workflowId: string): Promise<WorkflowRecord | null>;
  saveWorkflow(workflow: Omit<WorkflowRecord, "createdAt" | "updatedAt">): Promise<WorkflowRecord>;
  deleteWorkflow(workflowId: string): Promise<void>;

  // ===== 数据集 =====
  getDatasets(userId: string): Promise<UserDataset[]>;
  saveDataset(dataset: Omit<UserDataset, "createdAt" | "updatedAt">): Promise<UserDataset>;
  deleteDataset(datasetId: string): Promise<void>;

  // ===== 项目缓存 =====
  getProjectCache(projectId: string): Promise<ProjectCache | null>;
  setProjectCache(cache: ProjectCache): Promise<void>;
  getAllProjectCaches(): Promise<ProjectCache[]>;
}

/**
 * 创建数据库实例的工厂函数
 * 根据环境变量选择实现
 */
export function createDatabase(): DatabaseInterface {
  // 当前使用 mock 实现
  // 未来根据环境变量切换:
  // if (process.env.NEXT_PUBLIC_DB_PROVIDER === "supabase") {
  //   return new SupabaseDatabase();
  // }
  const { MockDatabase } = require("./mock");
  return new MockDatabase();
}
