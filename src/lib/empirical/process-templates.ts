"use client";

/**
 * Hayes PROCESS 宏模板库
 * 内置 15 个最常用的中介/调节模型（营销/消费者行为研究高频使用）
 * 参考: Hayes, A. F. (2022). Introduction to Mediation, Moderation, and Conditional Process Analysis (3rd ed.)
 */

export interface FrameworkSlot {
  id: string;
  label: string;
  role: "iv" | "dv" | "mediator" | "moderator" | "covariate";
  required: boolean;
  assigneeId?: string;
}

export interface PathDefinition {
  from: string;
  to: string;
  label?: string;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  nameCN: string;
  description: string;
  modelNumber: number;
  category: "mediation" | "moderation" | "mediated-moderation" | "moderated-mediation" | "serial" | "parallel" | "custom";
  slots: FrameworkSlot[];
  paths: PathDefinition[];
  interpretation: string;
  useCase: string;
}

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  // ========== 调节效应 ==========
  {
    id: "model-1",
    name: "Simple Moderation",
    nameCN: "简单调节效应",
    description: "X 对 Y 的影响受到 W 的调节（交互项 X×W）",
    modelNumber: 1,
    category: "moderation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "w", label: "调节变量 (W)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "y", label: "c₁" },
      { from: "w", to: "y", label: "c₂" },
      { from: "x", to: "y", label: "c₃ (X×W)" },
    ],
    interpretation: "关注交互项 X×W 的系数 c₃ 是否显著。若显著，说明 W 调节了 X 对 Y 的影响。需做简单斜率分析。",
    useCase: "价格对购买意愿的影响是否受到促销类型的调节",
  },
  {
    id: "model-2",
    name: "Parallel Moderation",
    nameCN: "并行双调节",
    description: "两个调节变量 W、Z 同时调节 X→Y",
    modelNumber: 2,
    category: "moderation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "w", label: "调节变量 1 (W)", role: "moderator", required: true },
      { id: "z", label: "调节变量 2 (Z)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "y", label: "c₁" },
      { from: "w", to: "y", label: "c₂" },
      { from: "z", to: "y", label: "c₃" },
      { from: "x", to: "y", label: "c₄ (X×W)" },
      { from: "x", to: "y", label: "c₅ (X×Z)" },
    ],
    interpretation: "分别检验两个交互项 X×W 和 X×Z 是否显著。",
    useCase: "品牌广告效果同时受到受众年龄和收入的调节",
  },
  // ========== 中介效应 ==========
  {
    id: "model-4",
    name: "Simple Mediation",
    nameCN: "简单中介效应",
    description: "X 通过 M 影响 Y（Baron-Kenny 三步法 + Bootstrap CI）",
    modelNumber: 4,
    category: "mediation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
    ],
    paths: [
      { from: "x", to: "m", label: "a" },
      { from: "m", to: "y", label: "b" },
      { from: "x", to: "y", label: "c (总效应)" },
      { from: "x", to: "y", label: "c' (直接效应)" },
    ],
    interpretation: "间接效应 ab 的 Bootstrap CI 不包含 0 则中介显著。c' 不显著为完全中介，c' 显著但 |c'|<|c| 为部分中介。",
    useCase: "品牌信任通过感知价值影响购买意愿",
  },
  {
    id: "model-6",
    name: "Parallel Mediation",
    nameCN: "并行中介",
    description: "X 通过 M₁ 和 M₂ 并行影响 Y",
    modelNumber: 6,
    category: "parallel",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m1", label: "中介变量 1 (M₁)", role: "mediator", required: true },
      { id: "m2", label: "中介变量 2 (M₂)", role: "mediator", required: true },
    ],
    paths: [
      { from: "x", to: "m1", label: "a₁" },
      { from: "x", to: "m2", label: "a₂" },
      { from: "m1", to: "y", label: "b₁" },
      { from: "m2", to: "y", label: "b₂" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "分别检验 a₁b₁ 和 a₂b₂ 的间接效应，比较两个中介路径的相对大小。",
    useCase: "社交媒体营销同时通过品牌认知和情感连接影响购买",
  },
  // ========== 序列中介 ==========
  {
    id: "model-5",
    name: "Serial Mediation",
    nameCN: "序列（链式）中介",
    description: "X → M₁ → M₂ → Y 链式中介",
    modelNumber: 5,
    category: "serial",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m1", label: "中介变量 1 (M₁)", role: "mediator", required: true },
      { id: "m2", label: "中介变量 2 (M₂)", role: "mediator", required: true },
    ],
    paths: [
      { from: "x", to: "m1", label: "a₁" },
      { from: "m1", to: "m2", label: "d₂₁" },
      { from: "m2", to: "y", label: "b₂" },
      { from: "x", to: "m2", label: "a₂" },
      { from: "m1", to: "y", label: "b₁" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "检验序列间接效应 a₁×d₂₁×b₂ 是否显著。同时检验 a₁×b₁ 和 a₂×b₂ 的单独中介。",
    useCase: "广告曝光 → 品牌认知 → 购买意愿 → 购买行为",
  },
  // ========== 调节中介 ==========
  {
    id: "model-7",
    name: "Moderated Mediation (a-path)",
    nameCN: "前半段调节中介",
    description: "W 调节 X→M 路径（a 路径），M 中介 X→Y",
    modelNumber: 7,
    category: "moderated-mediation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
      { id: "w", label: "调节变量 (W)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "m", label: "a₁" },
      { from: "w", to: "m", label: "a₂" },
      { from: "x", to: "m", label: "a₃ (X×W)" },
      { from: "m", to: "y", label: "b" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "检验条件间接效应 (a₁+a₃W)×b。当 W 取不同水平时，间接效应是否有显著差异。",
    useCase: "产品体验对口碑传播的影响，受到消费者涉入度的调节",
  },
  {
    id: "model-8",
    name: "Moderated Mediation (b-path)",
    nameCN: "后半段调节中介",
    description: "W 调节 M→Y 路径（b 路径），M 中介 X→Y",
    modelNumber: 8,
    category: "moderated-mediation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
      { id: "w", label: "调节变量 (W)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "m", label: "a" },
      { from: "m", to: "y", label: "b₁" },
      { from: "w", to: "y", label: "b₂" },
      { from: "m", to: "y", label: "b₃ (M×W)" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "检验条件间接效应 a×(b₁+b₃W)。当 W 取不同水平时，M 对 Y 的效应是否变化。",
    useCase: "品牌态度对购买的影响受到产品类别的调节",
  },
  {
    id: "model-9",
    name: "Dual Moderated Mediation",
    nameCN: "双路径调节中介",
    description: "W 调节 a 路径，Z 调节 b 路径",
    modelNumber: 9,
    category: "moderated-mediation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
      { id: "w", label: "调节变量 1 (W)", role: "moderator", required: true },
      { id: "z", label: "调节变量 2 (Z)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "m", label: "a₁" },
      { from: "w", to: "m", label: "a₂" },
      { from: "x", to: "m", label: "a₃ (X×W)" },
      { from: "m", to: "y", label: "b₁" },
      { from: "z", to: "y", label: "b₂" },
      { from: "m", to: "y", label: "b₃ (M×Z)" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "检验条件间接效应 (a₁+a₃W)×(b₁+b₃Z)。两条路径分别受到不同调节变量的影响。",
    useCase: "广告效果受受众特征调节，品牌信任对购买的影响受渠道类型调节",
  },
  {
    id: "model-14",
    name: "Moderated Direct Effect",
    nameCN: "直接效应被调节",
    description: "W 调节 X→Y 直接效应，M 中介 X→Y",
    modelNumber: 14,
    category: "mediated-moderation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
      { id: "w", label: "调节变量 (W)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "m", label: "a" },
      { from: "m", to: "y", label: "b" },
      { from: "x", to: "y", label: "c₁'" },
      { from: "w", to: "y", label: "c₂'" },
      { from: "x", to: "y", label: "c₃' (X×W)" },
    ],
    interpretation: "检验直接效应是否受到 W 的调节，同时控制中介路径。",
    useCase: "价格对复购的直接效应受会员等级调节，同时通过满意度中介",
  },
  {
    id: "model-15",
    name: "Moderated Indirect Effect",
    nameCN: "间接效应被调节",
    description: "W 同时调节 a 路径和 b 路径（交互项 X×W 在两条路径中）",
    modelNumber: 15,
    category: "moderated-mediation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
      { id: "w", label: "调节变量 (W)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "m", label: "a₁" },
      { from: "w", to: "m", label: "a₂" },
      { from: "x", to: "m", label: "a₃ (X×W)" },
      { from: "m", to: "y", label: "b₁" },
      { from: "m", to: "y", label: "b₂ (M×W)" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "间接效应 (a₁+a₃W)×(b₁+b₂W) 随 W 变化。Index of moderated mediation 检验。",
    useCase: "KOL 营销效果受粉丝粘性的全面调节",
  },
  {
    id: "model-21",
    name: "Two-Moderator Mediation",
    nameCN: "双调节变量中介",
    description: "两个调节变量 W、Z 共同调节中介效应（不区分路径）",
    modelNumber: 21,
    category: "moderated-mediation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
      { id: "w", label: "调节变量 1 (W)", role: "moderator", required: true },
      { id: "z", label: "调节变量 2 (Z)", role: "moderator", required: true },
    ],
    paths: [
      { from: "x", to: "m", label: "a" },
      { from: "m", to: "y", label: "b₁" },
      { from: "w", to: "y", label: "b₂" },
      { from: "z", to: "y", label: "b₃" },
      { from: "m", to: "y", label: "b₄ (M×W)" },
      { from: "m", to: "y", label: "b₅ (M×Z)" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "检验间接效应 a×(b₁+b₄W+b₅Z) 在不同 W×Z 组合下的条件效应。",
    useCase: "内容营销效果受平台类型和发布时间的双重调节",
  },
  // ========== 含协变量 ==========
  {
    id: "model-4-cov",
    name: "Mediation with Covariates",
    nameCN: "含协变量的中介效应",
    description: "X 通过 M 影响 Y，控制协变量 C₁、C₂",
    modelNumber: 4,
    category: "mediation",
    slots: [
      { id: "x", label: "自变量 (X)", role: "iv", required: true },
      { id: "y", label: "因变量 (Y)", role: "dv", required: true },
      { id: "m", label: "中介变量 (M)", role: "mediator", required: true },
      { id: "c1", label: "协变量 1 (C₁)", role: "covariate", required: false },
      { id: "c2", label: "协变量 2 (C₂)", role: "covariate", required: false },
    ],
    paths: [
      { from: "x", to: "m", label: "a" },
      { from: "m", to: "y", label: "b" },
      { from: "x", to: "y", label: "c'" },
    ],
    interpretation: "在控制协变量后，检验间接效应 ab 是否显著。",
    useCase: "控制年龄和收入后，检验社交媒体使用对幸福感的中介效应",
  },
  // ========== 自定义 ==========
  {
    id: "custom",
    name: "Custom Framework",
    nameCN: "自定义框架",
    description: "自由定义变量和路径，支持任意中介/调节组合",
    modelNumber: 0,
    category: "custom",
    slots: [],
    paths: [],
    interpretation: "自定义分析框架，根据实际研究模型自由配置。",
    useCase: "非标准研究设计，需要自定义路径结构",
  },
];
