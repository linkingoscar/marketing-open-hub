# Statistical Validation Framework

[English](./statistics-validation.md) | [中文](./statistics-validation_zh.md)

Scientific integrity and statistical correctness are core values of `marketing-open-hub`. This document describes the validation methodology, benchmark datasets, and rules for extending statistical capabilities.

---

## Maturity Levels (`ValidationLevel`)

| Level          | Badge        | Criteria                                                                                                                   | Permitted Claims                                       |
| -------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `validated`    | ✓ 已对拍验证 | Verified against SciPy / R reference scripts in `tests/reference/` with multi-case benchmarks (including $p \approx .05$). | Standard academic reporting, APA formatted exports.    |
| `beta`         | 🧪 Beta      | Implemented using standard textbook algorithms with unit tests; undergoing external reference dataset benchmarking.        | Exploratory and research workflows.                    |
| `experimental` | ⚠ 探索性指标 | Heuristic approximations or iterative numerical algorithms (e.g. exploratory skewness-kurtosis normality, iterative CFA).  | Exploratory guidance only; explicit disclaimers shown. |

---

## Reference Datasets (`tests/reference/stats-reference.test.ts`)

All validated tests must pass automated comparisons against certified outputs across multiple scenarios, including boundary cases near significance thresholds ($p \approx .05$):

1. **Descriptive Statistics**:
   - Reference: R `summary()` / SciPy `scipy.stats.describe()`.
   - Metrics: Mean, Sample Variance ($n-1$), Sample SD, Skewness, Kurtosis.
   - Verified on: Standard textbook datasets and degenerate zero-variance data.

2. **Welch's Independent Two-Sample t-Test**:
   - Reference: R `t.test(g1, g2)` (default Welch) / SciPy `stats.ttest_ind(equal_var=False)`.
   - Metrics: Welch $t$, Satterthwaite $df$, two-tailed $p$-value, Student's $t$ quantile 95% Confidence Interval, Cohen's $d$.
   - Verified on: Unequal variance samples and borderline significance cases ($p \approx .05$).

3. **Paired Samples t-Test**:
   - Reference: R `t.test(before, after, paired=TRUE)`.
   - Metrics: $t$, $df = n - 1$, $p$-value, $t_{\text{crit}}$ 95% Confidence Interval.
   - Verified on: Strong paired effect and borderline effect cases.

4. **One-Way ANOVA (F-Test)**:
   - Reference: R `summary(aov(y ~ group))` / SciPy `stats.f_oneway()`.
   - Metrics: $F$, $df_{\text{between}}$, $df_{\text{within}}$, $p$-value, $\eta^2$.
   - Tolerance: $F$ exact within rounding, analytical identity validation on balanced groups.

5. **Chi-Square Test of Independence**:
   - Reference: R `chisq.test(correct=FALSE)` / SciPy `stats.chi2_contingency(correction=False)`.
   - Metrics: $\chi^2$, $df$, $p$-value, Cramér's $V$.
   - Underlying math: Exact Regularized Incomplete Gamma function `regIncGamma(k/2, x/2)`.

6. **Pearson Correlation**:
   - Reference: R `cor.test()` / SciPy `stats.pearsonr()`.
   - Metrics: $r$, $t$, Student's $t$ distribution $p$-value ($df = n - 2$), Fisher's $z$ 95% Confidence Interval.
   - Verified on: Standard correlation datasets and boundary significance datasets ($p \approx .05$).

7. **Mann-Whitney U Test**:
   - Reference: R `wilcox.test(exact=FALSE, correct=FALSE)` / SciPy `stats.mannwhitneyu()`.
   - Metrics: $U$, asymptotic $z$, $p$-value.
   - Verified on: Completely separated groups ($U=0$) and overlapping distributions.

8. **Scale Reliability (Cronbach's Alpha)**:
   - Reference: R `psych::alpha()` / analytical variance decomposition.
   - Metrics: Standardized $\alpha$.
   - Verified on: Perfect correlation and realistic 4-item Likert survey datasets.

---

## Procedure for Adding New Statistical Tests

1. Place pure statistical logic in `src/lib/statistics/tests/<domain>.ts`.
2. Register the method in `src/lib/statistics/registry.ts`.
3. If marking as `validated`:
   - Add reference test in `tests/reference/`.
   - Provide at least 2 distinct benchmark cases (one textbook/standard case and one borderline $p \approx .05$ case).
   - Document data source (e.g. textbook citation, R/SciPy script).
4. If the test uses an approximation, document its limitations in `registry.ts` and tag it as `experimental` or `beta`.
