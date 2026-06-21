/**
 * 工作台相关的翻译
 */
export const workspaceTranslations: Record<string, Record<string, string>> = {
  // Workspace
  "workspace.title": { zh: "工作台", en: "Workspace" },
  "workspace.desc": { zh: "个开源项目的交互式工具，上传数据或输入内容直接开始分析", en: " interactive tools from open-source projects — upload data or input content to start analysis" },
  "workspace.api.configured": { zh: "API 已配置 — AI 工具可直接使用", en: "API configured — AI tools ready to use" },
  "workspace.api.missing": { zh: "未配置 API Key — 仅统计工具可用", en: "No API Key — only statistics tools available" },
  "workspace.guide.title": { zh: "研究流程指南", en: "Research Workflow Guide" },
  "workspace.status.usable": { zh: "可使用", en: "Ready" },
  "workspace.status.developing": { zh: "已上线", en: "Available" },

  // Guide steps
  "guide.step1": { zh: "数据准备", en: "Data Preparation" },
  "guide.step1.desc": { zh: "清洗数据、处理缺失值、反向题编码", en: "Clean data, handle missing values, reverse-code items" },
  "guide.step2": { zh: "探索性分析", en: "Exploratory Analysis" },
  "guide.step2.desc": { zh: "描述性统计、分布检验、相关矩阵", en: "Descriptive stats, distribution tests, correlation matrix" },
  "guide.step3": { zh: "信效度检验", en: "Reliability & Validity" },
  "guide.step3.desc": { zh: "Cronbach's α、项目分析、EFA/CFA", en: "Cronbach's α, item analysis, EFA/CFA" },
  "guide.step4": { zh: "假设检验", en: "Hypothesis Testing" },
  "guide.step4.desc": { zh: "t 检验、ANOVA、回归分析", en: "t-test, ANOVA, regression" },
  "guide.step5": { zh: "因果建模", en: "Causal Modeling" },
  "guide.step5.desc": { zh: "中介/调节效应、SEM、Uplift", en: "Mediation/moderation, SEM, Uplift" },
  "guide.step6": { zh: "结果导出", en: "Export Results" },
  "guide.step6.desc": { zh: "APA 格式输出、图表导出、论文段落", en: "APA format output, chart export, paper paragraphs" },
};
