# MarTech Open Hub

**市场营销 × 消费者行为研究的开源项目发现与实证分析平台**

<!-- 核心状态 -->
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/linkingoscar/marketing-open-hub/update-projects.yml?label=build)](https://github.com/linkingoscar/marketing-open-hub/actions)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)](https://martech-open-hub.vercel.app)

<!-- 框架与语言 -->
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

<!-- 工具与库 -->
[![Zustand](https://img.shields.io/badge/Zustand-5.x-FF6B35?logo=zustand)](https://zustand-demo.pmnd.rs/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-0055FF?logo=framer)](https://www.framer.com/motion/)
[![Recharts](https://img.shields.io/badge/Recharts-3.8-FF6B6B)](https://recharts.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest)](https://vitest.dev/)

<!-- 测试与质量 -->
[![Tests](https://img.shields.io/badge/Tests-60%20passed-brightgreen)](#测试)
[![Coverage](https://img.shields.io/badge/Coverage-statistics%20%2B%20workflow-brightgreen)](#测试)

<!-- GitHub 互动 -->
[![GitHub Stars](https://img.shields.io/github/stars/linkingoscar/marketing-open-hub?style=social)](https://github.com/linkingoscar/marketing-open-hub/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/linkingoscar/marketing-open-hub?style=social)](https://github.com/linkingoscar/marketing-open-hub/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/linkingoscar/marketing-open-hub)](https://github.com/linkingoscar/marketing-open-hub/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/linkingoscar/marketing-open-hub)](https://github.com/linkingoscar/marketing-open-hub/pulls)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/linkingoscar/marketing-open-hub/pulls)

<!-- 特性标签 -->
[![PWA](https://img.shields.io/badge/PWA-supported-5A0FC8)](https://martech-open-hub.vercel.app)
[![i18n](https://img.shields.io/badge/i18n-zh%20%7C%20en-blue)](#国际化)
[![SEO](https://img.shields.io/badge/SEO-JSON--LD%20%2B%20RSC-green)](#技术栈)
[![Security](https://img.shields.io/badge/Security-AES--GCM%20encrypted-orange)](#安全特性)

31 个学术级开源项目 · 36 种统计检验 · 18 个交互式工具 · 11 家 LLM API · 纯浏览器端计算

---

## ✨ 核心特性

- **项目发现**：31 个营销研究开源项目，9 大分类，评分雷达图，健康度评分
- **统计分析**：36 种检验方法，APA 格式输出，结果自动注释（通俗解释 + 应用建议）
- **营销模板**：10 个预设研究场景（品牌认知、A/B 测试、满意度、市场细分等）
- **场景对比**：7 大研究场景自动推荐相关工具，多维度雷达图对比
- **证据方向**：输入假设 → 搜索文献 → 支持/混合/反对百分比可视化
- **结构化提取**：文献自动提取样本量、方法、行业、效应量 → 导出 CSV
- **研究工作流**：可视化流程编排，4 个预设模板，步骤依赖管理
- **AI 助手**：11 家 LLM API 支持，对话式研究指导
- **论文辅助**：APA 格式输出、论文写作、AI 痕迹检测与润色
- **新手引导**：首次访问自动弹出 6 步引导流程
- **收藏功能**：一键收藏项目，支持导出/导入配置
- **数据安全**：API Key 加密存储（AES-GCM），纯浏览器端计算

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18
- **pnpm** ≥ 8（推荐）或 npm / yarn

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/linkingoscar/marketing-open-hub.git
cd marketing-open-hub

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev
```

打开浏览器访问 http://localhost:3000

### 其他命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 代码检查
pnpm test         # 运行测试（60 个）
pnpm test:watch   # 监听模式运行测试
pnpm test:coverage # 生成测试覆盖率报告
```

### 更新项目数据

```bash
# 从 GitHub API 更新 31 个项目的 stars/forks
node scripts/update-projects.js

# Dry run 模式（预览不写入）
node scripts/update-projects.js --dry-run
```

> 配置 `GITHUB_TOKEN` 环境变量可提高 API 速率限制。GitHub Actions 会每周自动更新。

---

## 📖 使用指南

### 第一步：配置 API Key（可选）

如果你需要使用 AI 功能（论文写作、情感分析、研究助手等），需要配置 LLM API Key：

1. 访问 [设置页面](http://localhost:3000/settings)
2. 选择一个提供商（推荐 **DeepSeek**，性价比最高）
3. 输入你的 API Key
4. 选择模型
5. 点击「测试连接」确认配置正确

> API Key 使用 AES-GCM 加密后存储在浏览器本地，密钥保存在 IndexedDB 中。

**推荐提供商**：

| 提供商 | 推荐模型 | 价格 | 说明 |
|--------|---------|------|------|
| DeepSeek | deepseek-v4-flash | ¥0.14/MTok | 性价比最高 |
| 通义千问 | qwen3.6-plus | ¥1.60/MTok | 中文效果好 |
| OpenAI | gpt-4.1 | $2.00/MTok | 英文最强 |
| Anthropic | claude-sonnet-4-6 | $5.00/MTok | 学术写作优秀 |

### 第二步：浏览开源项目

1. 访问 [首页](http://localhost:3000)，浏览 31 个营销研究开源项目
2. 按分类筛选（AI 模拟调研、情感分析、用户行为等）
3. 点击项目查看详情（评分雷达图、健康度评分、功能特性）
4. 使用 `Cmd+K` / `Ctrl+K` 快速搜索

### 第三步：使用统计分析

1. 访问 [统计分析](http://localhost:3000/workspace/statistics)
2. 上传 CSV/JSON 数据文件（或使用内置数据集）
3. 选择变量（点击变量画布选择 X/Y）
4. 选择检验方法（36 种，按分组筛选）
5. 点击「计算」查看结果
6. 结果包含：APA 格式、统计量、**通俗解释**、**应用建议**
7. 一键复制或导出报告

**支持的检验方法**：

| 分组 | 方法 |
|------|------|
| 描述 | 描述性统计、Likert 频率表 |
| 前提 | 正态性检验、方差齐性 |
| 比较 | t 检验、ANOVA、Mann-Whitney U、Wilcoxon |
| 分类 | 卡方检验、Fisher 精确检验 |
| 相关 | Pearson r、Spearman ρ |
| 回归 | 多元线性回归、二元 Logistic |
| 信度 | Cronbach's α、项目分析、分半信度 |
| 效度 | CR + AVE、HTMT、共同方法偏差 |
| 因子 | EFA、CFA |
| 中介调节 | 中介效应、调节效应 |
| 贝叶斯 | 贝叶斯 t 检验、贝叶斯相关 |
| 功效 | 功效分析（样本量估算） |

### 第四步：使用营销模板

1. 访问 [模板库](http://localhost:3000/workspace/templates)
2. 选择一个研究场景（如「品牌认知度研究」）
3. 查看推荐方法、数据结构、分析流程
4. 按照流程指引逐步完成分析

### 第五步：文献搜索与分析

1. 访问 [文献搜索](http://localhost:3000/workspace/literature)
2. **文献搜索**：输入关键词，筛选领域和年份
3. **证据方向**：输入研究假设，查看文献支持方向
4. **结构化提取**：自动提取论文关键字段，导出 CSV

### 第六步：研究工作流

1. 访问 [研究工作流](http://localhost:3000/workspace/workflow)
2. 选择预设模板（品牌认知、A/B 测试、量表开发、满意度）
3. 按步骤执行，标记完成状态
4. 工作流自动追踪进度

### 第七步：AI 辅助

- [AI 研究助手](http://localhost:3000/workspace/ai-assistant)：对话式研究指导
- [论文写作](http://localhost:3000/workspace/paper-writer)：6 种章节自动生成
- [论文润色](http://localhost:3000/workspace/writing-polish)：AI 痕迹检测 + 智能改写
- [情感分析](http://localhost:3000/workspace/sentiment)：批量文本情感分析

### 第八步：项目对比

1. 访问 [项目对比](http://localhost:3000/compare)
2. **场景对比**：选择研究场景（情感分析、因果推断等），自动推荐相关工具
3. **手动对比**：搜索并选择 2-4 个项目，查看雷达图和详细对比表

---

## 📁 项目结构

```
marketing-open-hub/
├── src/
│   ├── app/                          # Next.js App Router 页面
│   │   ├── layout.tsx                # 全局布局（含引导、分析、错误边界）
│   │   ├── page.tsx                  # 首页
│   │   ├── project/[id]/page.tsx     # 项目详情（Server Component + SEO）
│   │   ├── compare/page.tsx          # 项目对比（场景对比 + 手动对比）
│   │   ├── settings/page.tsx         # API 设置
│   │   └── workspace/               # 工作台（18 个工具页面）
│   ├── components/
│   │   ├── charts/                   # 图表组件（分布图、箱线图、散点图、热力图）
│   │   ├── effects/                  # 动画效果（滚动进度、3D 倾斜、水波纹）
│   │   ├── empirical/                # 实证分析（变量气泡、框架画布）
│   │   ├── home/                     # 首页组件（Hero、BentoGrid、趋势排行）
│   │   ├── layout/                   # 布局组件（Navbar、Footer、MobileTabBar）
│   │   ├── search/                   # 搜索组件（Cmd+K 命令面板）
│   │   ├── ui/                       # 基础 UI 组件（shadcn/ui）
│   │   ├── workspace/                # 工作台组件（文件上传、结果导出、模板选择等）
│   │   ├── analytics-provider.tsx    # 分析初始化（Sentry + PostHog）
│   │   ├── error-boundary.tsx        # 全局错误边界
│   │   └── project-detail-client.tsx # 项目详情客户端交互
│   ├── data/
│   │   ├── projects.ts               # 项目数据入口
│   │   ├── projects-data.json        # 31 个项目数据（JSON，可自动更新）
│   │   ├── categories.ts             # 9 大分类
│   │   ├── marketing-templates.ts    # 10 个营销模板
│   │   ├── datasets.ts               # 内置数据集
│   │   └── types.ts                  # TypeScript 类型定义
│   ├── hooks/                        # 自定义 Hooks
│   ├── lib/
│   │   ├── api/                      # API 层（LLM 调用、配置、历史、文献）
│   │   ├── crypto.ts                 # Web Crypto API 加密工具
│   │   ├── analytics.ts              # 错误追踪 + 用户分析
│   │   ├── config-export.ts          # 配置导出/导入
│   │   ├── db/                       # 数据库接口（抽象 + Mock 实现）
│   │   │   ├── types.ts              # 数据模型定义
│   │   │   ├── interface.ts          # 抽象接口
│   │   │   ├── mock.ts               # localStorage 实现
│   │   │   └── README.md             # 接口文档
│   │   ├── stores/                   # Zustand Store
│   │   │   ├── favorites.ts          # 收藏功能
│   │   │   └── workspace.ts          # 工作台状态（引导、数据流转）
│   │   ├── empirical/                # 实证分析算法（构念识别、PROCESS 模型）
│   │   ├── statistics/               # 统计注释系统
│   │   ├── workflow/                 # 工作流引擎
│   │   ├── i18n/                     # 国际化（模块化翻译）
│   │   │   ├── index.ts              # 入口
│   │   │   └── locales/              # 翻译文件（按功能拆分）
│   │   └── utils.ts                  # 工具函数
│   └── scripts/
│       └── update-projects.js        # 项目数据自动更新脚本
├── public/
│   ├── sw.js                         # Service Worker（分级缓存策略）
│   ├── manifest.json                 # PWA 清单
│   └── favicon.svg                   # 网站图标
├── scripts/
│   └── update-projects.js            # GitHub 数据更新脚本
├── .github/
│   └── workflows/
│       └── update-projects.yml       # GitHub Actions 自动更新
├── vitest.config.ts                  # Vitest 测试配置
├── next.config.ts                    # Next.js 配置（含 CSP 安全头）
├── tsconfig.json                     # TypeScript 配置
└── package.json                      # 依赖管理
```

---

## 🔧 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 框架 | Next.js (App Router + RSC) | 16.2.6 |
| 语言 | TypeScript (strict) | 5.x |
| 样式 | Tailwind CSS | 4.x |
| 组件库 | shadcn/ui + Radix UI | Latest |
| 动画 | Framer Motion | 12.x |
| 图表 | Recharts | 3.8 |
| 状态管理 | Zustand (persist) | 5.x |
| 搜索 | cmdk + Fuse.js | 1.x / 7.x |
| 测试 | Vitest | 3.2.x |
| 加密 | Web Crypto API (AES-GCM) | 浏览器原生 |
| 分析 | Sentry + PostHog（可选） | - |
| 文献 API | Semantic Scholar | Free |
| LLM API | 11 家（OpenAI/Anthropic/Gemini/DeepSeek 等） | - |

---

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

**测试覆盖**：
- `src/lib/statistics/annotations.test.ts` — 44 个测试（统计注释系统）
- `src/lib/workflow/engine.test.ts` — 16 个测试（工作流引擎）

---

## 🔐 安全特性

- **API Key 加密**：使用 Web Crypto API (AES-GCM) 加密后存储，密钥保存在 IndexedDB
- **CSP 安全头**：严格的 Content-Security-Policy，限制外部资源加载
- **纯前端计算**：统计数据在浏览器本地处理，不上传到任何服务器
- **隐私分析**：Sentry/PostHog 默认匿名化，支持 Do Not Track

---

## 🌐 国际化

支持中文/英文双语，翻译文件按功能模块拆分：

```
src/lib/i18n/
├── index.ts              # 入口
└── locales/
    ├── nav.ts            # 导航翻译
    ├── home.ts           # 首页翻译
    ├── workspace.ts      # 工作台翻译
    ├── settings.ts       # 设置翻译
    └── common.ts         # 通用翻译
```

---

## 📊 数据更新

项目数据存储在 `src/data/projects-data.json`，支持自动更新：

- **手动更新**：`node scripts/update-projects.js`
- **自动更新**：GitHub Actions 每周一自动从 GitHub API 更新 stars/forks
- **更新字段**：stars、forks、lastUpdated、description、homepage

---

## ⚠️ 免责声明

1. **学术参考**：统计分析结果仅供学术研究参考，正式发表前请使用专业软件（SPSS/R/Stata/Mplus）验证。
2. **计算精度**：部分检验为近似算法，可能与专业软件存在微小差异。
3. **AI 输出**：LLM 生成内容可能存在错误或偏见，请以人工审核为准。
4. **数据安全**：数据在浏览器本地处理，但 LLM 功能会将文本发送到 API 提供商。
5. **无担保**：本软件按"原样"提供，不作任何保证。

---

## 🙏 致谢

本平台的实现离不开以下优秀的开源项目：

### 核心框架

- [Next.js](https://github.com/vercel/next.js) — React 全栈框架
- [React](https://github.com/facebook/react) — UI 渲染引擎
- [TypeScript](https://github.com/microsoft/TypeScript) — 类型安全
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) — 原子化 CSS
- [shadcn/ui](https://github.com/shadcn-ui/ui) — 可复用组件库
- [Radix UI](https://github.com/radix-ui/primitives) — 无样式组件原语

### 可视化与动画

- [Recharts](https://github.com/recharts/recharts) — React 图表库
- [Framer Motion](https://github.com/framer/motion) — React 动画
- [Lucide](https://github.com/lucide-icons/lucide) — 图标库

### 状态管理与搜索

- [Zustand](https://github.com/pmndrs/zustand) — 轻量状态管理
- [cmdk](https://github.com/pacocoursey/cmdk) — 命令面板
- [Fuse.js](https://github.com/krisk/Fuse) — 模糊搜索

### 学术数据源

- [Semantic Scholar](https://www.semanticscholar.org/) — 2 亿+ 学术论文 API

### 灵感来源

- [JASP](https://jasp-stats.org/) — 开源统计分析平台
- [jamovi](https://www.jamovi.org/) — 基于 R 的统计套件
- [Elicit](https://elicit.com/) — AI 文献研究助手
- [Consensus](https://consensus.app/) — 学术搜索引擎
- [Research Rabbit](https://www.researchrabbit.ai/) — 文献发现工具
- [Scite](https://scite.ai/) — 智能引用分析

---

## 📄 License

[MIT](./LICENSE) © [linkingoscar](https://github.com/linkingoscar)
