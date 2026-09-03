# 统计检验基准验证体系

[English](./statistics-validation.md) | [中文](./statistics-validation_zh.md)

科学严谨性与统计正确性是 `marketing-open-hub` 的立项基石。本文档详细阐述平台的统计验证方法论、基准数据集体系以及扩展新统计检验的规范准则。

---

## 检验成熟度分级 (`ValidationLevel`)

| 成熟度等级     | 标识徽标     | 判定标准                                                                                     | 允许的学术使用场景                      |
| -------------- | ------------ | -------------------------------------------------------------------------------------------- | --------------------------------------- |
| `validated`    | ✓ 已对拍验证 | 在 `tests/reference/` 中经由 R / SciPy 多组参考用例（含 $p \approx .05$ 临界用例）对拍验证。 | 标准学术报告、符合 APA 规范的数据导出。 |
| `beta`         | 🧪 Beta      | 遵循标准教材算法实现，已通过单元测试，正在补充外部多场景基准对拍。                           | 实证探索研究、教学演示与分析流转。      |
| `experimental` | ⚠ 探索性指标 | 采用启发式近似或迭代数值算法（例如偏度-峰度探索性正态近似、迭代 CFA 近似算法）。             | 仅供探索性参考，附带显著免责声明。      |

---

## 参考基准用例套件 (`tests/reference/stats-reference.test.ts`)

所有标记为 `validated` 的统计方法必须通过自动化基准测试，且必须包含多组场景及临界显著性用例（$p \approx .05$）：

1. **描述性统计 (Descriptive Statistics)**：
   - 参考标准：R `summary()` / SciPy `scipy.stats.describe()`。
   - 检验指标：均值 (Mean)、无偏样本方差 (Sample Variance, $n-1$)、样本标准差 (SD)、偏度 (Skewness)、峰度 (Kurtosis)。
   - 覆盖用例：经典教材数据集，以及零方差/极端值边界数据集。

2. **Welch 独立双样本 t 检验 (Welch's Two-Sample t-Test)**：
   - 参考标准：R `t.test(g1, g2)`（R 默认 Welch 检验）/ SciPy `stats.ttest_ind(equal_var=False)`。
   - 检验指标：Welch $t$ 统计量、Welch-Satterthwaite 调整自由度 $df$、双尾 $p$ 值、基于 Student $t$ 分位数的 95% 置信区间、Cohen's $d$。
   - 覆盖用例：方差不齐经典用例，以及显著性临界用例（$p \approx .05$）。

3. **配对样本 t 检验 (Paired Samples t-Test)**：
   - 参考标准：R `t.test(before, after, paired=TRUE)`。
   - 检验指标：配对差值均值、配对 $t$ 统计量、$df = n - 1$、双尾 $p$ 值、基于 $t_{\text{crit}}$ 的 95% 置信区间。
   - 覆盖用例：显著差异用例与临界显著差异用例。

4. **单因素方差分析 (One-Way ANOVA F-Test)**：
   - 参考标准：R `summary(aov(y ~ group))` / SciPy `stats.f_oneway()`。
   - 检验指标：$F$ 统计量、组间自由度 $df_{\text{between}}$、组内自由度 $df_{\text{within}}$、$p$ 值、$\eta^2$ 效应量。
   - 验证标准：平衡组与非平衡组的解析恒等式与四舍五入一致性。

5. **卡方独立性检验 (Chi-Square Test of Independence)**：
   - 参考标准：R `chisq.test(correct=FALSE)` / SciPy `stats.chi2_contingency(correction=False)`。
   - 检验指标：$\chi^2$ 统计量、自由度 $df$、$p$ 值、Cramér's $V$。
   - 底层算法：采用精确正则化不完全 Gamma 函数 `regIncGamma(k/2, x/2)` 计算。

6. **Pearson 积差相关 (Pearson Correlation)**：
   - 参考标准：R `cor.test()` / SciPy `stats.pearsonr()`。
   - 检验指标：相关系数 $r$、$t$ 统计量、基于 Student $t$ 分布 CDF 计算的精确 $p$ 值（$df = n - 2$）、Fisher's $z$ 变换 95% 置信区间。
   - 覆盖用例：标准相关数据集与临界显著数据集（$p \approx .05$）。

7. **Mann-Whitney U 非参数检验 (Mann-Whitney U Test)**：
   - 参考标准：R `wilcox.test(exact=FALSE, correct=FALSE)` / SciPy `stats.mannwhitneyu()`。
   - 检验指标：秩和统计量 $U$、渐近正态 $z$ 值、$p$ 值。
   - 覆盖用例：完全分离分布（$U=0$）与重叠分布用例。

8. **量表内部一致性信度 (Cronbach's Alpha)**：
   - 参考标准：R `psych::alpha()` / 经典方差分解解析恒等式。
   - 检验指标：标准化 Cronbach's $\alpha$。
   - 覆盖用例：完全正相关理论用例与真实 4 题项 Likert 问卷调研数据。

---

## 新增统计方法的贡献流程

1. 纯计算逻辑必须放置于 `src/lib/statistics/tests/<domain>.ts`。
2. 在 `src/lib/statistics/registry.ts` 中注册该方法元数据及局限说明。
3. 若拟标记为 `validated`：
   - 必须在 `tests/reference/stats-reference.test.ts` 中编写基准测试。
   - 提供至少 2 组对比用例（包含 1 组教材/标准用例及 1 组 $p \approx .05$ 临界用例）。
   - 注明数据来源及 R / SciPy 验证代码。
4. 若采用启发式近似，必须在 `registry.ts` 中明确记录局限，并标记为 `beta` 或 `experimental`。
