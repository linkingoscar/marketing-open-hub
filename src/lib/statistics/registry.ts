import type { TestDef } from "./types";

export const TESTS: TestDef[] = [
  // 描述与前提检验
  {
    id: "descriptive",
    label: "描述性统计",
    desc: "M, SD, Median, Min, Max, Skewness, Kurtosis",
    category: "描述",
    validationLevel: "validated",
  },
  {
    id: "likert-freq",
    label: "Likert 频率表",
    desc: "各选项频次、百分比、有效百分比",
    category: "描述",
    validationLevel: "beta",
  },
  {
    id: "normality",
    label: "正态性检验",
    desc: "偏度-峰度正态性检验（探索性启发式）",
    category: "前提",
    validationLevel: "experimental",
  },
  {
    id: "homogeneity",
    label: "方差齐性",
    desc: "Levene's F 检验",
    category: "前提",
    validationLevel: "beta",
  },
  // 比较检验
  {
    id: "ttest",
    label: "独立样本 t",
    desc: "两组均值比较 (Welch's t) + Cohen's d",
    category: "比较",
    validationLevel: "validated",
  },
  {
    id: "paired-ttest",
    label: "配对样本 t",
    desc: "前后测/配对设计均值比较",
    category: "比较",
    validationLevel: "validated",
  },
  {
    id: "mann-whitney",
    label: "Mann-Whitney U",
    desc: "非参数两组比较",
    category: "比较",
    validationLevel: "validated",
  },
  {
    id: "wilcoxon",
    label: "Wilcoxon 符号秩",
    desc: "配对非参数检验",
    category: "比较",
    validationLevel: "beta",
  },
  {
    id: "anova",
    label: "单因素 ANOVA",
    desc: "多组均值比较 + η² + Tukey HSD",
    category: "比较",
    validationLevel: "validated",
  },
  {
    id: "kruskal-wallis",
    label: "Kruskal-Wallis",
    desc: "非参数多组比较",
    category: "比较",
    validationLevel: "beta",
  },
  {
    id: "repeated-anova",
    label: "重复测量 ANOVA",
    desc: "组内设计方差分析",
    category: "比较",
    validationLevel: "beta",
  },
  // 分类检验
  {
    id: "chi-square",
    label: "卡方检验",
    desc: "χ² + Cramér's V + 残差分析",
    category: "分类",
    validationLevel: "validated",
  },
  {
    id: "fisher",
    label: "Fisher 精确检验",
    desc: "小样本 2×2 表",
    category: "分类",
    validationLevel: "beta",
  },
  // 相关
  {
    id: "pearson",
    label: "Pearson r",
    desc: "积差相关 + r² + 置信区间",
    category: "相关",
    validationLevel: "validated",
  },
  {
    id: "spearman",
    label: "Spearman ρ",
    desc: "秩相关（非参数）",
    category: "相关",
    validationLevel: "beta",
  },
  // 回归
  {
    id: "regression",
    label: "多元线性回归",
    desc: "OLS + β + VIF + DW + R²adj",
    category: "回归",
    validationLevel: "beta",
  },
  {
    id: "logistic",
    label: "二元 Logistic",
    desc: "OR + 分类准确率",
    category: "回归",
    validationLevel: "beta",
  },
  // 量表信度
  {
    id: "cronbach",
    label: "Cronbach's α",
    desc: "内部一致性信度 + 逐题项分析",
    category: "信度",
    validationLevel: "validated",
  },
  {
    id: "item-analysis",
    label: "项目分析",
    desc: "题项鉴别度 + item-total 相关 + 删除后 α",
    category: "信度",
    validationLevel: "beta",
  },
  {
    id: "split-half",
    label: "分半信度",
    desc: "Spearman-Brown 校正分半信度",
    category: "信度",
    validationLevel: "beta",
  },
  {
    id: "cr-ave",
    label: "CR + AVE",
    desc: "组合信度 + 平均方差提取量（收敛效度）",
    category: "效度",
    validationLevel: "beta",
  },
  // 因子分析
  {
    id: "efa",
    label: "EFA 探索性因子",
    desc: "KMO + Bartlett + 主成分 + Varimax 旋转载荷",
    category: "因子",
    validationLevel: "experimental",
  },
  {
    id: "cfa",
    label: "CFA 验证性因子",
    desc: "模型拟合指标 + 标准化载荷 + 修正指数",
    category: "因子",
    validationLevel: "experimental",
  },
  // 效度检验
  {
    id: "htmt",
    label: "HTMT 区别效度",
    desc: "异质-单质相关比率 + Fornell-Larcker",
    category: "效度",
    validationLevel: "experimental",
  },
  {
    id: "cmv",
    label: "共同方法偏差",
    desc: "Harman 单因子检验",
    category: "效度",
    validationLevel: "experimental",
  },
  // 问卷专项
  {
    id: "conjoint",
    label: "联合分析",
    desc: "正交设计 + 效用值 + 属性重要性",
    category: "问卷",
    validationLevel: "experimental",
  },
  {
    id: "maxdiff",
    label: "MaxDiff",
    desc: "最好-最差评分 + 计分",
    category: "问卷",
    validationLevel: "experimental",
  },
  // 中介与调节
  {
    id: "mediation",
    label: "中介效应",
    desc: "Baron-Kenny + Sobel + Bootstrap CI",
    category: "中介调节",
    validationLevel: "beta",
  },
  {
    id: "moderation",
    label: "调节效应",
    desc: "交互项 + 简单斜率分析",
    category: "中介调节",
    validationLevel: "beta",
  },
  // 功效分析
  {
    id: "power",
    label: "功效分析",
    desc: "样本量估算 + 检验力",
    category: "功效",
    validationLevel: "beta",
  },
  // 效果量
  {
    id: "effect-size",
    label: "效果量计算",
    desc: "Cohen's d / η² / ω² / f²",
    category: "效果量",
    validationLevel: "beta",
  },
  // 贝叶斯
  {
    id: "bayes-ttest",
    label: "贝叶斯 t 检验",
    desc: "Bayes Factor + 后验分布",
    category: "贝叶斯",
    validationLevel: "experimental",
  },
  {
    id: "bayes-correlation",
    label: "贝叶斯相关",
    desc: "贝叶斯因子 + 后验证据强度",
    category: "贝叶斯",
    validationLevel: "experimental",
  },
  // 比较检验（补充）
  {
    id: "friedman",
    label: "Friedman 检验",
    desc: "非参数重复测量",
    category: "比较",
    validationLevel: "beta",
  },
  {
    id: "ancova",
    label: "ANCOVA",
    desc: "协方差分析（控制协变量）",
    category: "比较",
    validationLevel: "beta",
  },
  {
    id: "manova",
    label: "MANOVA",
    desc: "多因变量方差分析",
    category: "比较",
    validationLevel: "beta",
  },
];

export const CATEGORIES = [...new Set(TESTS.map((t) => t.category))];
