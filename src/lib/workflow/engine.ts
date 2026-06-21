/**
 * 研究工作流编排系统
 * 支持创建、保存、执行多步骤研究流程
 */

export interface WorkflowStep {
  id: string;
  type: "literature-search" | "data-upload" | "statistical-test" | "visualization" | "ai-analysis" | "export";
  label: string;
  description: string;
  config: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: unknown;
  dependsOn: string[]; // step IDs this step depends on
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
  status: "draft" | "running" | "completed" | "failed";
}

/**
 * 预设工作流模板
 */
export const WORKFLOW_TEMPLATES: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "status">[] = [
  {
    name: "品牌认知度研究",
    description: "从文献搜索到统计分析的完整品牌认知度研究流程",
    steps: [
      {
        id: "step-1",
        type: "literature-search",
        label: "文献搜索",
        description: "搜索品牌认知度相关文献，了解研究现状",
        config: { query: "brand awareness measurement", fields: ["Business", "Psychology"] },
        status: "pending",
        dependsOn: [],
      },
      {
        id: "step-2",
        type: "data-upload",
        label: "上传数据",
        description: "上传品牌认知度调查数据（前后测）",
        config: { accept: ".csv,.json" },
        status: "pending",
        dependsOn: [],
      },
      {
        id: "step-3",
        type: "statistical-test",
        label: "信度检验",
        description: "检验量表内部一致性（Cronbach's α）",
        config: { test: "cronbach" },
        status: "pending",
        dependsOn: ["step-2"],
      },
      {
        id: "step-4",
        type: "statistical-test",
        label: "前后测比较",
        description: "配对 t 检验比较广告前后认知度变化",
        config: { test: "paired-ttest" },
        status: "pending",
        dependsOn: ["step-2"],
      },
      {
        id: "step-5",
        type: "visualization",
        label: "结果可视化",
        description: "生成前后测对比图表",
        config: { chartType: "bar" },
        status: "pending",
        dependsOn: ["step-4"],
      },
      {
        id: "step-6",
        type: "export",
        label: "导出报告",
        description: "导出 APA 格式结果和图表",
        config: { format: "html" },
        status: "pending",
        dependsOn: ["step-3", "step-4", "step-5"],
      },
    ],
  },
  {
    name: "A/B 测试分析",
    description: "从实验设计到结果报告的 A/B 测试完整流程",
    steps: [
      {
        id: "step-1",
        type: "data-upload",
        label: "上传实验数据",
        description: "上传 A/B 测试数据（版本、转化、收入）",
        config: { accept: ".csv,.json" },
        status: "pending",
        dependsOn: [],
      },
      {
        id: "step-2",
        type: "statistical-test",
        label: "描述性统计",
        description: "查看各组的基本统计量",
        config: { test: "descriptive" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-3",
        type: "statistical-test",
        label: "卡方检验",
        description: "比较两组转化率差异",
        config: { test: "chi-square" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-4",
        type: "statistical-test",
        label: "独立 t 检验",
        description: "比较两组收入差异",
        config: { test: "ttest" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-5",
        type: "statistical-test",
        label: "功效分析",
        description: "计算检验力和所需样本量",
        config: { test: "power" },
        status: "pending",
        dependsOn: ["step-3"],
      },
      {
        id: "step-6",
        type: "export",
        label: "导出报告",
        description: "导出完整 A/B 测试报告",
        config: { format: "html" },
        status: "pending",
        dependsOn: ["step-2", "step-3", "step-4", "step-5"],
      },
    ],
  },
  {
    name: "量表开发与验证",
    description: "从探索性因子分析到验证性因子分析的量表开发流程",
    steps: [
      {
        id: "step-1",
        type: "data-upload",
        label: "上传量表数据",
        description: "上传量表调查数据（样本1用于EFA，样本2用于CFA）",
        config: { accept: ".csv,.json" },
        status: "pending",
        dependsOn: [],
      },
      {
        id: "step-2",
        type: "statistical-test",
        label: "项目分析",
        description: "题项鉴别度和 item-total 相关",
        config: { test: "item-analysis" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-3",
        type: "statistical-test",
        label: "EFA 探索性因子",
        description: "KMO + Bartlett + 主成分分析 + Varimax 旋转",
        config: { test: "efa" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-4",
        type: "statistical-test",
        label: "信度检验",
        description: "Cronbach's α 内部一致性",
        config: { test: "cronbach" },
        status: "pending",
        dependsOn: ["step-3"],
      },
      {
        id: "step-5",
        type: "statistical-test",
        label: "CFA 验证性因子",
        description: "模型拟合指标 + 标准化载荷",
        config: { test: "cfa" },
        status: "pending",
        dependsOn: ["step-3"],
      },
      {
        id: "step-6",
        type: "statistical-test",
        label: "效度检验",
        description: "CR + AVE 收敛效度 + HTMT 区别效度",
        config: { test: "cr-ave" },
        status: "pending",
        dependsOn: ["step-5"],
      },
      {
        id: "step-7",
        type: "export",
        label: "导出报告",
        description: "导出量表验证完整报告",
        config: { format: "html" },
        status: "pending",
        dependsOn: ["step-2", "step-4", "step-5", "step-6"],
      },
    ],
  },
  {
    name: "消费者满意度研究",
    description: "从数据收集到驱动因素分析的满意度研究流程",
    steps: [
      {
        id: "step-1",
        type: "data-upload",
        label: "上传满意度数据",
        description: "上传 NPS/CSAT 调查数据",
        config: { accept: ".csv,.json" },
        status: "pending",
        dependsOn: [],
      },
      {
        id: "step-2",
        type: "statistical-test",
        label: "描述性统计",
        description: "满意度评分的基本分布",
        config: { test: "descriptive" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-3",
        type: "statistical-test",
        label: "Likert 频率表",
        description: "各满意度等级的频率分布",
        config: { test: "likert-freq" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-4",
        type: "statistical-test",
        label: "相关分析",
        description: "各因素与满意度的相关性",
        config: { test: "pearson" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-5",
        type: "statistical-test",
        label: "回归分析",
        description: "识别满意度的关键驱动因素",
        config: { test: "regression" },
        status: "pending",
        dependsOn: ["step-1"],
      },
      {
        id: "step-6",
        type: "visualization",
        label: "结果可视化",
        description: "生成驱动因素重要性图表",
        config: { chartType: "bar" },
        status: "pending",
        dependsOn: ["step-5"],
      },
      {
        id: "step-7",
        type: "export",
        label: "导出报告",
        description: "导出满意度分析报告",
        config: { format: "html" },
        status: "pending",
        dependsOn: ["step-2", "step-3", "step-4", "step-5", "step-6"],
      },
    ],
  },
];

/**
 * 创建新工作流
 */
export function createWorkflow(template: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "status">): Workflow {
  return {
    ...template,
    steps: template.steps.map((step) => ({ ...step })),
    id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "draft",
  };
}

/**
 * 获取工作流中可执行的步骤（所有依赖已完成）
 */
export function getExecutableSteps(workflow: Workflow): WorkflowStep[] {
  return workflow.steps.filter((step) => {
    if (step.status !== "pending") return false;
    return step.dependsOn.every((depId) => {
      const dep = workflow.steps.find((s) => s.id === depId);
      return dep?.status === "completed";
    });
  });
}

/**
 * 获取工作流进度
 */
export function getWorkflowProgress(workflow: Workflow): { completed: number; total: number; percentage: number } {
  const completed = workflow.steps.filter((s) => s.status === "completed").length;
  const total = workflow.steps.length;
  return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
