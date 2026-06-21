# 数据库接口文档

## 概述

MarTech Open Hub 使用抽象数据库接口设计，支持多种后端实现：

- **当前实现**: `MockDatabase` — 使用 localStorage 模拟，无需后端
- **未来支持**: Supabase / Firebase / PostgreSQL / MongoDB

## 架构

```
src/lib/db/
├── types.ts      # 数据库 Schema 类型定义
├── interface.ts  # 抽象接口定义
├── mock.ts       # localStorage mock 实现
└── README.md     # 本文档
```

## 数据模型

### 用户 (UserProfile)

```typescript
interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    language: "zh" | "en";
    theme: "dark" | "light" | "system";
    defaultProvider?: string;
    onboardingCompleted: boolean;
  };
}
```

### 收藏 (Favorite)

```typescript
interface Favorite {
  id: string;
  userId: string;
  projectId: string;
  createdAt: string;
  note?: string;
}
```

### 分析历史 (AnalysisRecord)

```typescript
interface AnalysisRecord {
  id: string;
  userId: string;
  toolId: string;
  toolName: string;
  type: "statistical-test" | "sentiment-analysis" | "ai-analysis" | "literature-search" | "export";
  inputSummary: string;
  resultSummary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
```

### API 配置 (APIConfig)

```typescript
interface APIConfig {
  id: string;
  userId: string;
  provider: string;
  apiKeyEncrypted: string;
  model: string;
  isPreferred: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 工作流 (WorkflowRecord)

```typescript
interface WorkflowRecord {
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
```

## 接口方法

### 用户操作

| 方法 | 说明 |
|------|------|
| `getUser(userId)` | 获取用户信息 |
| `createUser(user)` | 创建新用户 |
| `updateUser(userId, updates)` | 更新用户信息 |
| `deleteUser(userId)` | 删除用户及所有关联数据 |

### 收藏操作

| 方法 | 说明 |
|------|------|
| `getFavorites(userId)` | 获取用户所有收藏 |
| `addFavorite(userId, projectId)` | 添加收藏 |
| `removeFavorite(userId, projectId)` | 移除收藏 |
| `isFavorite(userId, projectId)` | 检查是否已收藏 |

### 分析历史

| 方法 | 说明 |
|------|------|
| `getAnalysisHistory(userId, limit?)` | 获取分析历史 |
| `addAnalysisRecord(record)` | 添加分析记录 |
| `deleteAnalysisRecord(recordId)` | 删除单条记录 |
| `clearAnalysisHistory(userId)` | 清空历史 |

### API 配置

| 方法 | 说明 |
|------|------|
| `getAPIConfigs(userId)` | 获取所有 API 配置 |
| `saveAPIConfig(config)` | 保存 API 配置 |
| `deleteAPIConfig(configId)` | 删除 API 配置 |
| `getPreferredConfig(userId)` | 获取首选配置 |

### 工作流

| 方法 | 说明 |
|------|------|
| `getWorkflows(userId)` | 获取所有工作流 |
| `getWorkflow(workflowId)` | 获取单个工作流 |
| `saveWorkflow(workflow)` | 保存工作流 |
| `deleteWorkflow(workflowId)` | 删除工作流 |

## 接入新后端

### 1. 实现 DatabaseInterface

```typescript
import { DatabaseInterface } from "./interface";

export class SupabaseDatabase implements DatabaseInterface {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    const { data } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  }

  // ... 实现其他方法
}
```

### 2. 更新工厂函数

```typescript
// src/lib/db/interface.ts
export function createDatabase(): DatabaseInterface {
  if (process.env.NEXT_PUBLIC_DB_PROVIDER === "supabase") {
    return new SupabaseDatabase();
  }
  return new MockDatabase();
}
```

### 3. 环境变量

```env
NEXT_PUBLIC_DB_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## Supabase Schema (参考)

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 分析历史表
CREATE TABLE analysis_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  type TEXT NOT NULL,
  input_summary TEXT,
  result_summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API 配置表
CREATE TABLE api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model TEXT NOT NULL,
  is_preferred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工作流表
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_history_user ON analysis_records(user_id);
CREATE INDEX idx_api_configs_user ON api_configs(user_id);
CREATE INDEX idx_workflows_user ON workflows(user_id);
```

## 注意事项

1. **数据安全**: API Key 必须加密存储，即使在数据库中也不应明文保存
2. **隐私合规**: 用户数据应支持导出和删除（GDPR）
3. **软删除**: 建议使用软删除策略，保留审计日志
4. **速率限制**: 对 API 调用添加速率限制
5. **备份**: 定期备份用户数据
