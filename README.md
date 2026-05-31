# MarTech Open Hub

市场营销 × 消费者行为研究的**开源项目发现与实证分析平台**。

31 个学术级开源项目，18 个可直接使用的交互式分析工具，覆盖从数据清洗到论文输出的完整研究链路。

> 🔬 纯浏览器端计算 · 数据不离开设备 · 11 家 LLM API 支持 · MIT 开源

---

## 项目定位

研究者在做消费者行为 / 市场营销实证研究时，通常需要：
- 找到合适的开源工具（GitHub 搜索效率低）
- 安装配置各种 Python/R 环境（门槛高）
- 在 SPSS/JASP/SmartPLS 之间切换（碎片化）
- 手动将结果转化为 APA 格式论文段落（重复劳动）

**MarTech Open Hub 把这一切整合到一个浏览器平台上**：发现工具 → 上传数据 → 选择分析方法 → 一键输出 APA 结果。

---

## 核心能力

### 1. 项目发现（首页）

| 功能 | 说明 |
|------|------|
| 31 个开源项目 | 覆盖 9 大研究方向，全部学术级 |
| 分类浏览 | Bento Grid 布局，按方向快速筛选 |
| 项目详情 | 评分雷达图、健康度评分、功能特性、适用场景 |
| 多维对比 | 最多 4 个项目同时对比（雷达图 + 详细表格） |
| 智能搜索 | `Cmd+K` 命令面板，按名称/描述/标签模糊搜索 |
| 热门排行 | 按 GitHub Stars 排名 |

### 2. 实证分析工作台

#### 📊 统计分析 `/workspace/statistics`

**36 种检验方法**，全部 APA 格式输出 + 自然语言结论 + **结果自动注释**：

| 分组 | 方法 |
|------|------|
| 描述 | 描述性统计、Likert 频率表 |
| 前提 | Shapiro-Wilk 正态性、Levene's 方差齐性 |
| 比较 | 独立 t、配对 t、Mann-Whitney U、Wilcoxon、ANOVA、重复测量 ANOVA、Kruskal-Wallis、Friedman、ANCOVA、MANOVA |
| 分类 | 卡方检验、Fisher 精确检验（双侧） |
| 相关 | Pearson r、Spearman ρ |
| 回归 | 多元线性回归、二元 Logistic |
| 信度 | Cronbach's α（逐题项 + 删除后 α）、项目分析、分半信度 |
| 效度 | CR + AVE、HTMT 区别效度、共同方法偏差 Harman |
| 因子 | EFA（KMO + Bartlett + Varimax）、CFA（RMSEA + CFI + SRMR） |
| 问卷 | 联合分析、MaxDiff |
| 中介调节 | 中介效应（Baron-Kenny + Sobel）、调节效应（交互项 + 简单斜率） |
| 贝叶斯 | 贝叶斯 t 检验、贝叶斯相关（BF₁₀ 分级） |
| 功效 | 功效分析（样本量估算） |
| 效果量 | Cohen's d、η²、ω²、f² |

特色：变量画布 · 构念分组器 · 智能建议 · 可视化图表 · 自然语言结论 · 历史记录

#### 🔬 实证分析 `/workspace/empirical`

构念自动识别 · 变量画布 · 11 个 Hayes PROCESS 模型 · 拖拽式分析 · 路径动画

#### 🧹 数据清洗 `/workspace/data-clean`

构念得分计算 · 反向题 Recode · 缺失值处理 · 异常值检测 · 数据预览

#### 🎯 因果推断 `/workspace/causal`

Uplift 建模 · 双重差分 (DiD) · 合成控制法 · Granger 因果 · AI 因果分析

#### 💰 客户价值 `/workspace/clv` · 📈 时间序列 `/workspace/timeseries` · 💬 情感分析 `/workspace/sentiment` · 🧪 AI 模拟调研 `/workspace/synthetic-research` · 📊 用户行为 `/workspace/user-behavior` · 🏷️ 品牌监测 `/workspace/brand-monitoring` · ✅ 需求验证 `/workspace/demand-validation` · 🔗 SEM `/workspace/sem` · 🔗 SEM 编辑器 `/workspace/sem-editor` · 🧮 贝叶斯 `/workspace/bayesian` · 🤖 AI 助手 `/workspace/ai-assistant` · ✍️ 论文写作 `/workspace/paper-writer` · ✨ 论文润色 `/workspace/writing-polish` · 📦 数据集 `/workspace/datasets`

### 3. 高级功能

| 功能 | 路由 | 说明 |
|------|------|------|
| 📋 营销研究模板库 | `/workspace/templates` | 10 个预设场景，推荐方法 + 数据结构 + 分析流程 |
| 🔄 研究工作流 | `/workspace/workflow` | 可视化流程编排，4 个预设模板 |
| 📚 文献搜索 | `/workspace/literature` | Semantic Scholar 2 亿+ 论文 · 证据方向仪表盘 · 结构化提取 |
| 📊 结果注释 | 统计分析内置 | 每个检验结果自动附带通俗解释、实际意义、应用建议 |
| 🏷️ 健康度评分 | 项目详情页 | 5 维评分（活跃度/社区/文档/相关度/维护） |

---

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 (App Router + RSC) |
| 语言 | TypeScript (strict) |
| 样式 | Tailwind CSS 4 |
| 组件库 | shadcn/ui + Radix UI |
| 动画 | Framer Motion 12 + GSAP 3.15 |
| 图表 | Recharts |
| 状态管理 | Zustand (persist middleware) |
| 搜索 | cmdk + Fuse.js |
| 文献 API | Semantic Scholar |
| 国际化 | 自研 i18n hook（useI18n） |
| LLM API | OpenAI / Anthropic / Gemini / DeepSeek / 通义千问 / Kimi / 豆包 / 文心 / 星火 / 智谱 / MiMo（11 家） |

---

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev
# → http://localhost:3000

# 构建
pnpm build

# 生产预览
pnpm start
```

Windows 用户双击 `启动.bat` 一键启动。

### API 配置

1. 打开 http://localhost:3000/settings
2. 选择提供商（如 DeepSeek），点击展开
3. 输入 API Key，选择模型
4. AI 工具即可使用

> API Key 仅保存在浏览器本地（localStorage），不会上传到任何服务器。

---

## 路由表（30 个）

| 路由 | 说明 |
|------|------|
| `/` | 首页 |
| `/category/[slug]` | 分类列表 |
| `/project/[id]` | 项目详情 |
| `/compare` | 项目对比 |
| `/settings` | API 设置 |
| `/workspace` | 工作台首页 |
| `/workspace/templates` | 营销研究模板库 |
| `/workspace/workflow` | 研究工作流 |
| `/workspace/empirical` | 实证分析工作台 |
| `/workspace/statistics` | 统计分析（36 种） |
| `/workspace/data-clean` | 数据清洗 |
| `/workspace/causal` | 因果推断 |
| `/workspace/clv` | 客户价值 |
| `/workspace/timeseries` | 时间序列 |
| `/workspace/sentiment` | 情感分析 |
| `/workspace/synthetic-research` | AI 模拟调研 |
| `/workspace/user-behavior` | 用户行为分析 |
| `/workspace/brand-monitoring` | 品牌监测 |
| `/workspace/demand-validation` | 需求验证 |
| `/workspace/sem` | 结构方程模型 |
| `/workspace/sem-editor` | SEM 路径编辑器 |
| `/workspace/bayesian` | 贝叶斯分析面板 |
| `/workspace/ai-assistant` | AI 研究助手 |
| `/workspace/paper-writer` | 论文写作辅助 |
| `/workspace/writing-polish` | 论文润色 |
| `/workspace/datasets` | 数据集市场 |
| `/workspace/literature` | 文献搜索 |
| `/workspace/[tool]` | 通用工具页（动态） |

---

## 现阶段功能范围

本平台为**前端纯静态应用**，所有统计计算在浏览器端完成，不依赖后端服务器。

### 已实现

- ✅ 31 个开源项目发现与对比
- ✅ 36 种统计检验（浏览器端计算）
- ✅ 10 个营销研究模板
- ✅ 证据方向仪表盘（文献自动分类）
- ✅ 结构化文献提取
- ✅ 研究工作流编排
- ✅ 项目健康度评分
- ✅ 11 家 LLM API 对话
- ✅ 论文写作辅助与润色
- ✅ 数据清洗与可视化

### 当前限制

| 限制 | 说明 |
|------|------|
| 统计计算精度 | 部分检验（Shapiro-Wilk、CFA）为近似算法，正式发表请使用 SPSS/R/lavaan 验证 |
| 数据存储 | 所有数据存储在浏览器 localStorage，清除浏览器数据会丢失 |
| 协作功能 | 暂不支持多人实时协作 |
| 问卷集成 | 暂不支持直接从问卷星/Qualtrics 导入 |
| 离线使用 | 需要网络连接（LLM API、文献搜索） |

---

## 免责声明

1. **学术用途参考**：本平台提供的统计分析结果仅供学术研究参考，不构成统计学或医学建议。正式发表论文前，请使用专业统计软件（SPSS、R、Stata、Mplus 等）进行交叉验证。

2. **计算精度**：浏览器端实现的统计检验算法为近似计算，可能与专业软件存在微小差异。特别是 Shapiro-Wilk 检验、CFA 拟合指标等复杂算法，建议仅作为初步筛选依据。

3. **AI 输出**：本平台集成了多家 LLM API，AI 生成的内容（论文段落、研究建议、情感分析等）可能存在错误或偏见，请以人工审核为准。

4. **数据安全**：用户上传的数据仅在浏览器本地处理，不会上传到本平台服务器。但使用 LLM 功能时，相关文本会发送到用户配置的 API 提供商。请勿上传敏感或涉密数据。

5. **开源项目信息**：本平台收录的 31 个开源项目信息（Stars、Forks、描述等）为静态数据，可能与 GitHub 实时数据存在偏差。

6. **无担保**：本软件按"原样"提供，不作任何明示或暗示的保证。作者不对因使用本软件而产生的任何损害承担责任。

---

## 致谢

本平台的实现离不开以下优秀的开源项目和社区：

### 核心框架与工具

| 项目 | 用途 | 链接 |
|------|------|------|
| **Next.js** | React 全栈框架 | [github.com/vercel/next.js](https://github.com/vercel/next.js) |
| **React** | UI 渲染引擎 | [github.com/facebook/react](https://github.com/facebook/react) |
| **TypeScript** | 类型安全 | [github.com/microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| **Tailwind CSS** | 原子化 CSS 框架 | [github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) |
| **shadcn/ui** | 可复用组件库 | [github.com/shadcn-ui/ui](https://github.com/shadcn-ui/ui) |
| **Radix UI** | 无样式组件原语 | [github.com/radix-ui/primitives](https://github.com/radix-ui/primitives) |

### 数据可视化与动画

| 项目 | 用途 | 链接 |
|------|------|------|
| **Recharts** | React 图表库 | [github.com/recharts/recharts](https://github.com/recharts/recharts) |
| **Framer Motion** | React 动画库 | [github.com/framer/motion](https://github.com/framer/motion) |
| **GSAP** | 高性能动画引擎 | [github.com/greensock/GSAP](https://github.com/greensock/GSAP) |
| **Lucide React** | 图标库 | [github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide) |

### 状态管理与搜索

| 项目 | 用途 | 链接 |
|------|------|------|
| **Zustand** | 轻量状态管理 | [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand) |
| **cmdk** | 命令面板组件 | [github.com/pacocoursey/cmdk](https://github.com/pacocoursey/cmdk) |
| **Fuse.js** | 模糊搜索引擎 | [github.com/krisk/Fuse](https://github.com/krisk/Fuse) |

### 学术数据源

| 项目 | 用途 | 链接 |
|------|------|------|
| **Semantic Scholar** | 2 亿+ 学术论文 API | [github.com/allenai/s2-fol](https://github.com/allenai/s2-fol) |

### 灵感来源

本平台的统计分析模块参考了以下项目的实现思路：

- **JASP** — 开源统计分析平台，APA 格式输出的标杆
- **jamovi** — 基于 R 的开源统计套件
- **Elicit** — AI 文献研究助手，结构化数据提取的先驱
- **Consensus** — 学术搜索引擎，证据方向可视化
- **Research Rabbit** — 免费文献发现工具，引用网络图谱
- **Scite** — 智能引用分析，支持/矛盾分类

### 数据集

平台内置数据集来自公开学术数据源，具体来源请查看各数据集说明。

---

## License

[MIT](./LICENSE)
