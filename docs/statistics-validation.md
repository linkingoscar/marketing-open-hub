# Statistical Validation Framework

Scientific integrity and statistical correctness are core values of `marketing-open-hub`. This document describes the validation methodology, benchmark datasets, and rules for extending statistical capabilities.

---

## Maturity Levels (`ValidationLevel`)

| Level          | Badge        | Criteria                                                                                                                  | Permitted Claims                                       |
| -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `validated`    | ✓ 已对拍验证 | Verified against SciPy / R reference scripts in `tests/reference/` with strict numerical tolerances.                      | Standard academic reporting, APA formatted exports.    |
| `beta`         | 🧪 Beta      | Implemented using standard textbook algorithms with unit tests; undergoing external reference dataset benchmarking.       | Exploratory and research workflows.                    |
| `experimental` | ⚠ 探索性指标 | Heuristic approximations or iterative numerical algorithms (e.g. exploratory skewness-kurtosis normality, iterative CFA). | Exploratory guidance only; explicit disclaimers shown. |

---

## Reference Datasets (`tests/reference/`)

All validated tests must pass automated comparisons against certified outputs:

1. **Student's Two-Sample t-Test**:
   - Reference: R `t.test(var.equal=TRUE)` / SciPy `stats.ttest_ind(equal_var=True)`.
   - Metrics: $t$, $df$, $p$-value, Cohen's $d$.
   - Tolerance: Relative error $\le 0.1\%$, $p$-value accurate to 4 decimal places.

2. **One-Way ANOVA**:
   - Reference: R `summary(aov(y ~ group))` / SciPy `stats.f_oneway()`.
   - Metrics: $F$, $df_{\text{between}}$, $df_{\text{within}}$, $p$-value, $\eta^2$.
   - Tolerance: $F$ exact within rounding, analytical identity validation on balanced groups.

3. **Pearson Correlation**:
   - Reference: R `cor.test()` / SciPy `stats.pearsonr()`.
   - Metrics: $r$, $t$, $p$-value, Fisher's $z$ 95% Confidence Interval.
   - Tolerance: $|r| \le 0.001$, CI limits accurate to 2 decimal places.

4. **Chi-Square Test of Independence**:
   - Reference: R `chisq.test(correct=FALSE)` / SciPy `stats.chi2_contingency(correction=False)`.
   - Metrics: $\chi^2$, $df$, $p$-value, Cramér's $V$.
   - Underlying math: Exact Regularized Incomplete Gamma function `regIncGamma(k/2, x/2)`.

5. **Mann-Whitney U Test**:
   - Reference: R `wilcox.test(exact=FALSE, correct=FALSE)` / SciPy `stats.mannwhitneyu()`.
   - Metrics: $U$, asymptotic $z$, $p$-value.

---

## Procedure for Adding New Statistical Tests

1. Place pure statistical logic in `src/lib/statistics/tests/<domain>.ts`.
2. Register the method in `src/lib/statistics/registry.ts`.
3. If marking as `validated`:
   - Add reference test in `tests/reference/`.
   - Document data source (e.g. textbook page or public benchmark dataset).
   - State expected output from R or SciPy.
4. If the test uses an approximation, document its limitations in `registry.ts` and tag it as `experimental` or `beta`.
