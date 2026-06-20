# MarTech Open Hub

**市场营销 × 消费者行为研究的开源项目发现与实证分析平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-State-433E2A?logo=zustand&logoColor=white)](https://zustand-demo.pmnd.rs/)
[![Recharts](https://img.shields.io/badge/Recharts-Charts-AA3496?logo=apacheecharts&logoColor=white)](https://recharts.org/)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Radix UI](https://img.shields.io/badge/Radix-UI-161618?logo=radixui&logoColor=white)](https://www.radix-ui.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Components-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Semantic Scholar](https://img.shields.io/badge/Semantic-Scholar-1A1A1A?logo=semanticscholar&logoColor=white)](https://www.semanticscholar.org/)
[![LLM](https://img.shields.io/badge/LLM-Powered-412991?logo=openai&logoColor=white)](#)
[![Browser](https://img.shields.io/badge/Browser-Only-4CAF50?logo=googlechrome&logoColor=white)](#)
[![Responsive](https://img.shields.io/badge/Responsive-Design-38BDF8?logo=tailwindcss&logoColor=white)](#)

31 个学术级开源项目 · 36 种统计检验 · 18 个交互式工具 · 11 家 LLM API · 纯浏览器端计算

> **[English](README.en.md)**

---

## ✨ 核心特性

- **项目发现**：31 个营销研究开源项目，9 大分类，评分雷达图，健康度评分
- **统计分析**：36 种检验方法，APA 格式输出，结果自动注释（通俗解释 + 应用建议）
- **营销模板**：10 个预设研究场景（品牌认知、A/B 测试、满意度、市场细分等）
- **证据方向**：输入假设 → 搜索文献 → 支持/混合/反对百分比可视化
- **结构化提取**：文献自动提取样本量、方法、行业、效应量 → 导出 CSV
- **研究工作流**：可视化流程编排，4 个预设模板，步骤依赖管理
- **AI 助手**：11 家 LLM API 支持，对话式研究指导
- **论文辅助**：APA 格式输出、论文写作、AI 痕迹检测与润色
- **数据安全**：纯浏览器端计算，数据不离开设备

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
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务器
pnpm lint     # 代码检查
```

---

## 📖 使用指南

### 第一步：配置 API Key（可选）

如果你需要使用 AI 功能（论文写作、情感分析、研究助手等），需要配置 LLM API Key：

1. 访问 [设置页面](http://localhost:3000/settings)
2. 选择一个提供商（推荐 **DeepSeek**，性价比最高）
3. 输入你的 API Key
4. 选择模型
5. 点击「测试连接」确认配置正确

> API Key 仅保存在浏览器本地（localStorage），不会上传到任何服务器。

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

---

## 🔧 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 框架 | Next.js (App Router + RSC) | 16.2.6 |
| 语言 | TypeScript (strict) | 5.x |
| 样式 | Tailwind CSS | 4.x |
| 组件库 | shadcn/ui + Radix UI | Latest |
| 动画 | Framer Motion + GSAP | 12.x / 3.15 |
| 图表 | Recharts | 3.8 |
| 状态管理 | Zustand (persist) | 5.x |
| 搜索 | cmdk + Fuse.js | 1.x / 7.x |
| 文献 API | Semantic Scholar | Free |
| LLM API | 11 家（OpenAI/Anthropic/Gemini/DeepSeek 等） | - |

---

## 📄 License

[MIT](./LICENSE) © [linkingoscar](https://github.com/linkingoscar)