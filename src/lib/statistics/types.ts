/**
 * 统计方法与结果统一类型定义
 */

export type ValidationLevel = "validated" | "beta" | "experimental";

export type TestType =
  | "descriptive"
  | "likert-freq"
  | "normality"
  | "homogeneity"
  | "ttest"
  | "paired-ttest"
  | "mann-whitney"
  | "wilcoxon"
  | "anova"
  | "kruskal-wallis"
  | "friedman"
  | "repeated-anova"
  | "ancova"
  | "manova"
  | "chi-square"
  | "fisher"
  | "pearson"
  | "spearman"
  | "partial-corr"
  | "regression"
  | "logistic"
  | "cronbach"
  | "item-analysis"
  | "split-half"
  | "efa"
  | "cfa"
  | "cr-ave"
  | "htmt"
  | "cmv"
  | "conjoint"
  | "maxdiff"
  | "mediation"
  | "moderation"
  | "power"
  | "effect-size"
  | "bayes-ttest"
  | "bayes-correlation";

export interface TestDef {
  id: TestType;
  label: string;
  desc: string;
  category: string;
  validationLevel: ValidationLevel;
  referenceDoc?: string;
}

export interface APAReport {
  title: string;
  test: string;
  statistic: string;
  df: string;
  p: string;
  effect: string;
  ci: string;
  conclusion: string;
  interpretation: string;
}

export interface AnalysisWarning {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
}

export interface StatisticalResult {
  stats: Record<string, number | string>;
  apa: APAReport;
  validationLevel?: ValidationLevel;
  warnings?: AnalysisWarning[];
  itemDetails?: Record<string, string | number>[];
  freqTable?: Record<string, number>[];
  details?: Record<string, string | number>[];
  matrix?: Record<string, string | number>[];
  partWorths?: Record<string, Record<string, number>>;
  scores?: Record<string, number>;
}
