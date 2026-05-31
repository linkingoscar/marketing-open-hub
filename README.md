# MarTech Open Hub

市场营销 × 消费者行为研究的**开源项目发现与实证分析平台**。

31 个学术级开源项目，18 个可直接使用的交互式分析工具，覆盖从数据清洗到论文输出的完整研究链路。

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
| 项目详情 | 评分雷达图、功能特性、适用场景、相关推荐 |
| 多维对比 | 最多 4 个项目同时对比（雷达图 + 详细表格） |
| 智能搜索 | `Cmd+K` 命令面板，按名称/描述/标签模糊搜索 |
| 热门排行 | 按 GitHub Stars 排名 |

### 2. 实证分析工作台（核心竞争力）

#### 🔬 实证分析 `/workspace/empirical`

| 功能 | 说明 |
|------|------|
| 构念自动识别 | 上传 CSV → 按命名规则自动分组（支持 `_数字`、`Item数字`、驼峰、中文） |
| 变量画布 | 玻璃质感大圈(构念)套小圈(题项)，支持拖拽/右键/合并 |
| PROCESS 框架 | 内置 11 个 Hayes PROCESS 模型 |
| 拖拽式分析 | 将构念拖入框架槽位 → 运行 → 路径动画反馈 |
| 路径动画 | 光束沿路径行进，绿色=显著 / 红色=不显著 |

#### 📊 统计分析 `/workspace/statistics`

**36 种检验方法**，全部 APA 格式输出 + 自然语言结论：

| 分组 | 方法 |
|------|------|
| 描述 | 描述性统计、Likert 频率表 |
| 前提 | Shapiro-Wilk 正态性、Levene's 方差齐性 |
| 比较 | 独立 t、配对 t、Mann-Whitney U、Wilcoxon、ANOVA、重复测量 ANOVA、Kruskal-Wallis、Friedman、ANCOVA、MANOVA |
| 分类 | 卡方检验、Fisher 精确检验 |
| 相关 | Pearson r、Spearman ρ |
| 回归 | 多元线性回归、二元 Logistic |
| 信度 | Cronbach's α（逐题项 + 删除后 α）、项目分析、分半信度（Spearman-Brown） |
| 效度 | CR + AVE、HTMT 区别效度、共同方法偏差 Harman |
| 因子 | EFA（KMO + Bartlett + Varimax 旋转载荷）、CFA（RMSEA + CFI + SRMR） |
| 问卷 | 联合分析（效用值 + 属性重要性）、MaxDiff（最好-最差评分排名） |
| 中介调节 | 中介效应（Baron-Kenny + Sobel）、调节效应（交互项 + 简单斜率） |
| 贝叶斯 | 贝叶斯 t 检验、贝叶斯相关（BF₁₀ 分级） |
| 功效 | 功效分析（样本量估算） |
| 效果量 | Cohen's d、η²、ω²、f² |

特色功能：
- **变量画布**：上传后自动展示所有变量（支持中文），点击选择 X/Y/G
- **构念分组器**：量表分析时手动分组题项
- **智能建议**：检测数据特征，推荐合适的检验方法
- **可视化图表**：分布直方图、箱线图、散点图、相关矩阵热力图
- **自然语言结论**："在 α=0.05 水平下，两组均值存在显著差异"
- **历史记录**：分析结果自动保存，可回溯

#### 🧹 数据清洗 `/workspace/data-clean`

| 功能 | 说明 |
|------|------|
| 构念得分计算 | 多题项合并为均值（trust_1~5 → trust_score） |
| 反向题 Recode | 量表值反转（1→7, 2→6...） |
| 缺失值处理 | 删除含缺失行 / 均值插补 / 中位数插补 |
| 异常值检测 | IQR 方法检测并移除 |
| 数据预览 | 处理前后对比 + 处理日志 + CSV 导出 |

#### 🎯 因果推断 `/workspace/causal`

| 方法 | 说明 |
|------|------|
| Uplift 建模 | S/T/X-Learner + CATE 估计 + 特征影响力 |
| 双重差分 (DiD) | 干预前后 + 对照组因果效应 |
| 合成控制法 | 构建反事实基准线 |
| Granger 因果 | 时间序列因果关系检验 |
| AI 因果分析 | LLM 辅助因果推断与解释 |

#### 💰 客户价值 `/workspace/clv`

| 功能 | 说明 |
|------|------|
| RFM 分析 | 自动计算 R/F/M 值 + 评分 |
| 客户分群 | 冠军/忠实/潜力/风险/流失 5 级 |
| Top N 排名 | 高价值客户排名表 |
| AI 营销策略 | LLM 生成分群营销建议 |

#### 📈 时间序列 `/workspace/timeseries`

| 功能 | 说明 |
|------|------|
| 趋势分解 | 移动平均法分解为趋势 + 季节性 + 残差 |
| 统计摘要 | 均值、标准差、趋势方向、季节强度、自相关 |
| 3 张图表 | 原始+趋势、季节性、残差（可导出 PNG/SVG） |
| AI 解读 | LLM 生成时间序列解读和预测建议 |

#### 📚 文献搜索 `/workspace/literature`

基于 Semantic Scholar API，2 亿+ 学术论文：
- 中英文关键词搜索
- 学科领域 / 年份筛选
- 论文卡片：标题/作者/年份/期刊/引用数/摘要
- 开放获取标注 + PDF 直链

#### 💬 情感分析 `/workspace/sentiment`

| 功能 | 说明 |
|------|------|
| 6 种分析类型 | 情感分析 / 主题提取 / 用户画像 / 竞品分析 / 购买意向 / 自定义 |
| 文件上传 | CSV/JSON，自动识别文本列，支持中文 |
| 批量处理 | 逐条分析 + 汇总统计 |
| 结构化输出 | JSON 格式：情感分数/情绪分布/方面级/可执行建议 |

#### 🧪 AI 模拟调研 `/workspace/synthetic-research`

6 种预设：购买意向 / 概念测试 / 情感分析 / 竞品分析 / 用户画像 / 自定义
- LLM 流式输出
- 结果复制/下载

#### 📊 用户行为分析 `/workspace/user-behavior`

| 功能 | 说明 |
|------|------|
| 漏斗分析 | 事件序列转化率可视化 |
| 留存分析 | 按日/周/月留存率热力图 |
| RFM 分群 | 自动计算 + 分群柱状图 |
| 同期群分析 | 按注册时间分组追踪 |
| AI 洞察 | LLM 生成行为分析建议 |

#### 🏷️ 品牌监测 `/workspace/brand-monitoring`

4 种模式：品牌可见性 / 舆情监测 / 竞品对比 / 危机预警

#### ✅ 需求验证 `/workspace/demand-validation`

4 种模式：创意验证 / PMF 评分 / 市场规模 / 定价策略

#### 🔗 结构方程模型 `/workspace/sem`

PLS-SEM 完整流程：定义潜变量 → 指定路径 → 运行 → 测量模型 + 结构模型 + 拟合指标 + 信效度

#### 🔗 SEM 路径编辑器 `/workspace/sem-editor`

SVG 拖拽式路径图编辑器：添加变量节点 → 拖拽排列 → 点击连线 → 自动计算路径系数 + R²

#### 🧮 贝叶斯分析面板 `/workspace/bayesian`

LLM 引导式贝叶斯分析：先验分布选择 / 后验解读 / 贝叶斯因子 / 模型比较 / 敏感性分析 / 报告撰写

#### 🤖 AI 研究助手 `/workspace/ai-assistant`

对话式研究助手：描述需求 → AI 推荐工具 → 解释方法 → 指导操作。支持快捷操作按钮。

#### ✍️ 论文写作辅助 `/workspace/paper-writer`

AI 驱动，6 种章节生成：方法描述 / 结果解读 / 讨论撰写 / 摘要生成 / 文献定位 / 局限性。输入研究信息和统计结果，自动生成符合 APA 规范的学术段落。

#### ✨ 论文润色 `/workspace/writing-polish`

5 种润色模式：AI 痕迹检测（30+ 种模式）/ 智能润色（双 Pass 改写）/ 期刊适配（按目标期刊风格调整）/ 风格校准（学习你的写作风格）/ 逐节精修（按修辞结构优化）。支持快速扫描（无需 API）和深度润色（需 API）。

#### 📦 数据集市场 `/workspace/datasets`

6 个内置公开数据集（问卷/A/B测试/交易/社媒/营销/量表），一键下载 CSV，直接上传到分析工具使用。

---

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 (App Router + RSC) |
| 语言 | TypeScript (strict) |
| 样式 | Tailwind CSS 4 |
| 组件库 | shadcn/ui (base-nova) + Radix UI |
| 动画 | Framer Motion 12 + GSAP 3.15 (ScrollTrigger) |
| 图表 | Recharts |
| 状态管理 | Zustand (persist middleware) |
| 搜索 | cmdk + Fuse.js |
| 文献 API | Semantic Scholar |
| 国际化 | 自研 i18n hook（useI18n） |
| PWA | Service Worker + manifest.json |
| LLM API | OpenAI / Anthropic / DeepSeek / 通义千问 / Kimi / 豆包 / 文心 / 星火 / 智谱 / MiMo / Gemini（共 11 家） |
| 部署 | Vercel |

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

---

## 项目结构

```
src/
├── app/
│   ├── layout.tsx                       # 全局布局
│   ├── page.tsx                         # 首页
│   ├── loading.tsx                      # 全局加载骨架屏
│   ├── not-found.tsx                    # 404 页面
│   ├── globals.css                      # 设计系统 Token
│   ├── sitemap.ts / robots.ts           # SEO
│   ├── category/[slug]/page.tsx         # 分类列表
│   ├── project/[id]/page.tsx            # 项目详情
│   ├── compare/page.tsx                 # 项目对比
│   ├── settings/page.tsx                # API 设置
│   └── workspace/
│       ├── page.tsx                     # 工作台首页（31 项目）
│       ├── [tool]/page.tsx              # 通用工具页
│       ├── empirical/page.tsx           # 实证分析工作台
│       ├── statistics/page.tsx          # 统计分析（36 种）
│       ├── data-clean/page.tsx          # 数据清洗
│       ├── causal/page.tsx              # 因果推断
│       ├── clv/page.tsx                 # 客户价值
│       ├── timeseries/page.tsx          # 时间序列
│       ├── sentiment/page.tsx           # 情感分析
│       ├── synthetic-research/page.tsx  # AI 模拟调研
│       ├── user-behavior/page.tsx       # 用户行为
│       ├── brand-monitoring/page.tsx    # 品牌监测
│       ├── demand-validation/page.tsx   # 需求验证
│       ├── sem/page.tsx                 # 结构方程模型
│       ├── sem-editor/page.tsx          # SEM 路径编辑器
│       ├── bayesian/page.tsx            # 贝叶斯分析面板
│       ├── ai-assistant/page.tsx        # AI 研究助手
│       ├── paper-writer/page.tsx        # 论文写作辅助
│       ├── datasets/page.tsx            # 数据集市场
│       └── literature/page.tsx          # 文献搜索
├── components/
│   ├── empirical/                       # 变量气泡、框架画布、路径动画
│   ├── charts/                          # 分布图、箱线图、散点图、热力图
│   ├── workspace/                       # 文件上传、历史面板、智能建议、数据概览
│   ├── effects/                         # 滚动进度、3D 倾斜、水波纹
│   ├── home/                            # Hero、BentoGrid、堆叠卡片、趋势排行
│   ├── layout/                          # Navbar、Footer、MobileTabBar
│   ├── search/                          # Cmd+K 命令面板
│   └── ui/                              # shadcn/ui 组件
├── data/
│   ├── types.ts                         # Project, CategoryInfo 类型
│   ├── categories.ts                    # 9 大分类
│   └── projects.ts                      # 31 个项目
├── hooks/                               # 打字机、数字滚动、滚动动画
└── lib/
    ├── api/
    │   ├── config.ts                    # API Key 管理（11 家提供商）
    │   ├── client.ts                    # 统一 LLM 调用（含 fallback）
    │   ├── history.ts                   # 分析历史持久化
    │   └── semantic-scholar.ts          # 文献搜索 API
    ├── empirical/
    │   ├── construct-detector.ts        # 构念自动识别
    │   └── process-templates.ts         # PROCESS 模型模板
    └── utils.ts                         # cn() 工具函数
```

---

## 路由表（25 个）

| 路由 | 说明 | 类型 |
|------|------|------|
| `/` | 首页 | 静态 |
| `/category/[slug]` | 分类列表 | 动态 |
| `/project/[id]` | 项目详情 | 动态 |
| `/compare` | 项目对比 | 静态 |
| `/settings` | API 设置 | 静态 |
| `/workspace` | 工作台首页 | 静态 |
| `/workspace/[tool]` | 通用工具页 | 动态 |
| `/workspace/empirical` | 实证分析工作台 | 静态 |
| `/workspace/statistics` | 统计分析 | 静态 |
| `/workspace/data-clean` | 数据清洗 | 静态 |
| `/workspace/causal` | 因果推断 | 静态 |
| `/workspace/clv` | 客户价值 | 静态 |
| `/workspace/timeseries` | 时间序列 | 静态 |
| `/workspace/sentiment` | 情感分析 | 静态 |
| `/workspace/synthetic-research` | AI 模拟调研 | 静态 |
| `/workspace/user-behavior` | 用户行为分析 | 静态 |
| `/workspace/brand-monitoring` | 品牌监测 | 静态 |
| `/workspace/demand-validation` | 需求验证 | 静态 |
| `/workspace/sem` | 结构方程模型 | 静态 |
| `/workspace/sem-editor` | SEM 路径编辑器 | 静态 |
| `/workspace/bayesian` | 贝叶斯分析面板 | 静态 |
| `/workspace/ai-assistant` | AI 研究助手 | 静态 |
| `/workspace/paper-writer` | 论文写作辅助 | 静态 |
| `/workspace/datasets` | 数据集市场 | 静态 |
| `/workspace/literature` | 文献搜索 | 静态 |

---

## PROCESS 模型模板（11 个）

| 模型 | 名称 | 变量数 | 典型场景 |
|------|------|--------|---------|
| Model 1 | 简单调节 | 3 | 价格→购买意愿，促销类型调节 |
| Model 2 | 并行双调节 | 4 | 广告效果受年龄和收入同时调节 |
| Model 4 | 简单中介 | 3 | 品牌信任→感知价值→购买意愿 |
| Model 5 | 序列中介 | 4 | 广告→品牌认知→购买意愿→购买 |
| Model 6 | 并行中介 | 4 | 社媒→品牌认知+情感连接→购买 |
| Model 7 | 前半段调节中介 | 4 | 体验→口碑，涉入度调节前半段 |
| Model 8 | 后半段调节中介 | 4 | 态度→购买，产品类别调节后半段 |
| Model 9 | 双路径调节 | 5 | 受众特征+渠道类型分别调节 |
| Model 14 | 直接效应被调节 | 4 | 价格→复购，会员等级调节直接效应 |
| Model 15 | 间接效应被调节 | 4 | KOL 营销，粉丝粘性全面调节 |
| Model 21 | 双调节变量中介 | 5 | 内容营销受平台+发布时间调节 |
| 自定义 | 自定义框架 | 任意 | 自由定义变量和路径 |

---

## API 提供商（11 家）

| 提供商 | Base URL | 推荐模型 |
|--------|---------|---------|
| OpenAI | `api.openai.com/v1` | gpt-5.5, gpt-4.1 |
| Anthropic | `api.anthropic.com/v1` | claude-opus-4-8, claude-sonnet-4-6 |
| Google Gemini | `generativelanguage.googleapis.com/v1beta` | gemini-2.5-pro, gemini-2.5-flash |
| 小米 MiMo | `api.xiaomimimo.com/v1` | mimo-v2.5-pro |
| DeepSeek | `api.deepseek.com` | deepseek-v4-flash, deepseek-v4-pro |
| 通义千问 | `dashscope.aliyuncs.com/compatible-mode/v1` | qwen3.7-max, qwen3.6-plus |
| Kimi | `api.moonshot.cn/v1` | kimi-k2.6, kimi-k2.5 |
| 豆包 | `ark.cn-beijing.volces.com/api/v3` | doubao-seed-2.0-pro-256k |
| 文心一言 | `qianfan.baidubce.com/v2` | ernie-5.1, ernie-5.0 |
| 讯飞星火 | `spark-api-open.xf-yun.com/v1` | 4.0Ultra |
| 智谱 | `open.bigmodel.cn/api/paas/v4` | glm-5.1, glm-4.7 |

---

## 未来优化方向

### 短期（1-2 周）

| 方向 | 说明 | 价值 |
|------|------|------|
| **问卷星 API 集成** | 直接从问卷星导入数据，无需下载 CSV | 数据采集闭环 |
| **研究项目管理** | 多次分析结果归档为"研究项目"，支持版本对比 | 研究可复现 |

### 中期（1-2 月）

| 方向 | 说明 | 价值 |
|------|------|------|
| **多人协作** | 分析结果通过 URL 分享，团队实时查看 | 团队研究协作 |
| **问卷生成器** | 基于研究问题自动生成问卷模板 | 从分析前移到数据采集 |
| **数据采集集成** | 问卷星/Qualtrics/Google Forms 直接连接 | 端到端闭环 |

### 长期（3-6 月）

| 方向 | 说明 | 价值 |
|------|------|------|
| **PyMC/Stan 后端集成** | 浏览器端贝叶斯计算（WebAssembly） | 学术级贝叶斯分析 |
| **AI 对话式全流程** | 从研究问题到论文输出的全自动 AI 流水线 | 极致易用 |

---

## License

MIT
