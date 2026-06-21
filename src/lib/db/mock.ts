/**
 * Mock 数据库实现
 *
 * 使用 localStorage 模拟数据库操作
 * 用于开发和测试，无需后端服务
 */

import type { DatabaseInterface } from "./interface";
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

// Storage keys
const KEYS = {
  user: (id: string) => `db:user:${id}`,
  favorites: (userId: string) => `db:favorites:${userId}`,
  history: (userId: string) => `db:history:${userId}`,
  apiConfigs: (userId: string) => `db:api:${userId}`,
  apiUsage: (userId: string) => `db:usage:${userId}`,
  workflows: (userId: string) => `db:workflows:${userId}`,
  datasets: (userId: string) => `db:datasets:${userId}`,
  projectCache: (id: string) => `db:project:${id}`,
};

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeFromStorage(key: string): void {
  localStorage.removeItem(key);
}

// ===== Mock Implementation =====

export class MockDatabase implements DatabaseInterface {
  // ===== 用户 =====
  async getUser(userId: string): Promise<UserProfile | null> {
    return getFromStorage<UserProfile>(KEYS.user(userId));
  }

  async createUser(user: Omit<UserProfile, "createdAt" | "updatedAt">): Promise<UserProfile> {
    const now = new Date().toISOString();
    const profile: UserProfile = { ...user, createdAt: now, updatedAt: now };
    setToStorage(KEYS.user(user.id), profile);
    return profile;
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getUser(userId);
    if (!existing) throw new Error("User not found");
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    setToStorage(KEYS.user(userId), updated);
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    removeFromStorage(KEYS.user(userId));
    removeFromStorage(KEYS.favorites(userId));
    removeFromStorage(KEYS.history(userId));
    removeFromStorage(KEYS.apiConfigs(userId));
    removeFromStorage(KEYS.apiUsage(userId));
    removeFromStorage(KEYS.workflows(userId));
    removeFromStorage(KEYS.datasets(userId));
  }

  // ===== 收藏 =====
  async getFavorites(userId: string): Promise<Favorite[]> {
    return getFromStorage<Favorite[]>(KEYS.favorites(userId)) ?? [];
  }

  async addFavorite(userId: string, projectId: string, note?: string): Promise<Favorite> {
    const favorites = await this.getFavorites(userId);
    const existing = favorites.find((f) => f.projectId === projectId);
    if (existing) return existing;

    const favorite: Favorite = {
      id: generateId(),
      userId,
      projectId,
      createdAt: new Date().toISOString(),
      note,
    };
    favorites.push(favorite);
    setToStorage(KEYS.favorites(userId), favorites);
    return favorite;
  }

  async removeFavorite(userId: string, projectId: string): Promise<void> {
    const favorites = await this.getFavorites(userId);
    const filtered = favorites.filter((f) => f.projectId !== projectId);
    setToStorage(KEYS.favorites(userId), filtered);
  }

  async isFavorite(userId: string, projectId: string): Promise<boolean> {
    const favorites = await this.getFavorites(userId);
    return favorites.some((f) => f.projectId === projectId);
  }

  // ===== 分析历史 =====
  async getAnalysisHistory(userId: string, limit = 50): Promise<AnalysisRecord[]> {
    const history = getFromStorage<AnalysisRecord[]>(KEYS.history(userId)) ?? [];
    return history.slice(0, limit);
  }

  async addAnalysisRecord(record: Omit<AnalysisRecord, "id" | "createdAt">): Promise<AnalysisRecord> {
    const history = getFromStorage<AnalysisRecord[]>(KEYS.history(record.userId)) ?? [];
    const newRecord: AnalysisRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    history.unshift(newRecord);
    // Keep only last 100 records
    if (history.length > 100) history.splice(100);
    setToStorage(KEYS.history(record.userId), history);
    return newRecord;
  }

  async deleteAnalysisRecord(recordId: string): Promise<void> {
    // Need to find which user this belongs to - scan all users
    // For mock, just remove from current user's history
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("db:history:")) {
        const history = getFromStorage<AnalysisRecord[]>(key) ?? [];
        const filtered = history.filter((r) => r.id !== recordId);
        if (filtered.length < history.length) {
          setToStorage(key, filtered);
          return;
        }
      }
    }
  }

  async clearAnalysisHistory(userId: string): Promise<void> {
    removeFromStorage(KEYS.history(userId));
  }

  // ===== API 配置 =====
  async getAPIConfigs(userId: string): Promise<APIConfig[]> {
    return getFromStorage<APIConfig[]>(KEYS.apiConfigs(userId)) ?? [];
  }

  async saveAPIConfig(config: Omit<APIConfig, "id" | "createdAt" | "updatedAt">): Promise<APIConfig> {
    const configs = await this.getAPIConfigs(config.userId);
    const existingIndex = configs.findIndex((c) => c.provider === config.provider);
    const now = new Date().toISOString();

    const newConfig: APIConfig = {
      ...config,
      id: existingIndex >= 0 ? configs[existingIndex].id : generateId(),
      createdAt: existingIndex >= 0 ? configs[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      configs[existingIndex] = newConfig;
    } else {
      configs.push(newConfig);
    }

    setToStorage(KEYS.apiConfigs(config.userId), configs);
    return newConfig;
  }

  async deleteAPIConfig(configId: string): Promise<void> {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("db:api:")) {
        const configs = getFromStorage<APIConfig[]>(key) ?? [];
        const filtered = configs.filter((c) => c.id !== configId);
        if (filtered.length < configs.length) {
          setToStorage(key, filtered);
          return;
        }
      }
    }
  }

  async getPreferredConfig(userId: string): Promise<APIConfig | null> {
    const configs = await this.getAPIConfigs(userId);
    return configs.find((c) => c.isPreferred) ?? configs[0] ?? null;
  }

  // ===== API 使用量 =====
  async getAPIUsage(userId: string, provider?: string): Promise<APIUsageRecord[]> {
    const usage = getFromStorage<APIUsageRecord[]>(KEYS.apiUsage(userId)) ?? [];
    if (provider) return usage.filter((u) => u.provider === provider);
    return usage;
  }

  async addAPIUsage(record: Omit<APIUsageRecord, "id" | "createdAt">): Promise<APIUsageRecord> {
    const usage = await this.getAPIUsage(record.userId);
    const newRecord: APIUsageRecord = {
      ...record,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    usage.push(newRecord);
    setToStorage(KEYS.apiUsage(record.userId), usage);
    return newRecord;
  }

  async getUsageSummary(userId: string, days = 30): Promise<{
    totalRequests: number;
    totalTokens: number;
    estimatedCost: number;
  }> {
    const usage = await this.getAPIUsage(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recent = usage.filter((u) => new Date(u.createdAt) >= cutoff);
    return {
      totalRequests: recent.length,
      totalTokens: recent.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0),
      estimatedCost: recent.reduce((sum, u) => sum + u.estimatedCost, 0),
    };
  }

  // ===== 工作流 =====
  async getWorkflows(userId: string): Promise<WorkflowRecord[]> {
    return getFromStorage<WorkflowRecord[]>(KEYS.workflows(userId)) ?? [];
  }

  async getWorkflow(workflowId: string): Promise<WorkflowRecord | null> {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("db:workflows:")) {
        const workflows = getFromStorage<WorkflowRecord[]>(key) ?? [];
        const found = workflows.find((w) => w.id === workflowId);
        if (found) return found;
      }
    }
    return null;
  }

  async saveWorkflow(workflow: Omit<WorkflowRecord, "createdAt" | "updatedAt">): Promise<WorkflowRecord> {
    const workflows = await this.getWorkflows(workflow.userId);
    const existingIndex = workflows.findIndex((w) => w.id === workflow.id);
    const now = new Date().toISOString();

    const newWorkflow: WorkflowRecord = {
      ...workflow,
      createdAt: existingIndex >= 0 ? workflows[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      workflows[existingIndex] = newWorkflow;
    } else {
      workflows.push(newWorkflow);
    }

    setToStorage(KEYS.workflows(workflow.userId), workflows);
    return newWorkflow;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("db:workflows:")) {
        const workflows = getFromStorage<WorkflowRecord[]>(key) ?? [];
        const filtered = workflows.filter((w) => w.id !== workflowId);
        if (filtered.length < workflows.length) {
          setToStorage(key, filtered);
          return;
        }
      }
    }
  }

  // ===== 数据集 =====
  async getDatasets(userId: string): Promise<UserDataset[]> {
    return getFromStorage<UserDataset[]>(KEYS.datasets(userId)) ?? [];
  }

  async saveDataset(dataset: Omit<UserDataset, "createdAt" | "updatedAt">): Promise<UserDataset> {
    const datasets = await this.getDatasets(dataset.userId);
    const existingIndex = datasets.findIndex((d) => d.id === dataset.id);
    const now = new Date().toISOString();

    const newDataset: UserDataset = {
      ...dataset,
      createdAt: existingIndex >= 0 ? datasets[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      datasets[existingIndex] = newDataset;
    } else {
      datasets.push(newDataset);
    }

    setToStorage(KEYS.datasets(dataset.userId), datasets);
    return newDataset;
  }

  async deleteDataset(datasetId: string): Promise<void> {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("db:datasets:")) {
        const datasets = getFromStorage<UserDataset[]>(key) ?? [];
        const filtered = datasets.filter((d) => d.id !== datasetId);
        if (filtered.length < datasets.length) {
          setToStorage(key, filtered);
          return;
        }
      }
    }
  }

  // ===== 项目缓存 =====
  async getProjectCache(projectId: string): Promise<ProjectCache | null> {
    return getFromStorage<ProjectCache>(KEYS.projectCache(projectId));
  }

  async setProjectCache(cache: ProjectCache): Promise<void> {
    setToStorage(KEYS.projectCache(cache.id), cache);
  }

  async getAllProjectCaches(): Promise<ProjectCache[]> {
    const caches: ProjectCache[] = [];
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("db:project:")) {
        const cache = getFromStorage<ProjectCache>(key);
        if (cache) caches.push(cache);
      }
    }
    return caches;
  }
}
