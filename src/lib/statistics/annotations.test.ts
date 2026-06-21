import { describe, it, expect } from "vitest";
import { generateAnnotation } from "./annotations";

describe("generateAnnotation", () => {
  // ===== Descriptive =====
  describe("descriptive", () => {
    it("returns a generic annotation for descriptive stats", () => {
      const result = generateAnnotation("descriptive", { mean: 3.5, sd: 1.2 }, { p: "N/A", conclusion: "描述性统计完成" });
      expect(result.oneLiner).toContain("集中趋势");
      expect(result.actionItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===== Normality =====
  describe("normality", () => {
    it("detects non-normal distribution (significant)", () => {
      const result = generateAnnotation("normality", {}, { p: "0.001", conclusion: "非正态" });
      expect(result.oneLiner).toContain("偏离正态");
      expect(result.actionItems.some((a) => a.includes("Mann-Whitney") || a.includes("非参数"))).toBe(true);
    });

    it("detects normal distribution (not significant)", () => {
      const result = generateAnnotation("normality", {}, { p: "0.42", conclusion: "正态" });
      expect(result.oneLiner).toContain("符合正态");
      expect(result.actionItems.some((a) => a.includes("参数检验"))).toBe(true);
    });
  });

  // ===== Homogeneity =====
  describe("homogeneity", () => {
    it("detects unequal variances (significant)", () => {
      const result = generateAnnotation("homogeneity", {}, { p: "0.003", conclusion: "方差不齐" });
      expect(result.oneLiner).toContain("方差不齐");
      expect(result.actionItems.some((a) => a.includes("Welch"))).toBe(true);
    });

    it("detects equal variances (not significant)", () => {
      const result = generateAnnotation("homogeneity", {}, { p: "0.55", conclusion: "方差齐" });
      expect(result.oneLiner).toContain("方差齐性");
    });
  });

  // ===== t-test =====
  describe("ttest / paired-ttest", () => {
    for (const testType of ["ttest", "paired-ttest"]) {
      it(`${testType}: significant result`, () => {
        const result = generateAnnotation(testType, { t: 3.45, df: 98 }, { p: "0.001", effect: "d = 0.72", conclusion: "显著" });
        expect(result.oneLiner).toContain("显著差异");
        expect(result.caveats.length).toBeGreaterThanOrEqual(2);
      });

      it(`${testType}: non-significant result`, () => {
        const result = generateAnnotation(testType, { t: 0.89, df: 98 }, { p: "0.38", conclusion: "不显著" });
        expect(result.oneLiner).toContain("无显著差异");
        expect(result.actionItems.some((a) => a.includes("功效"))).toBe(true);
      });
    }
  });

  // ===== ANOVA =====
  describe("anova", () => {
    it("significant result with post-hoc suggestion", () => {
      const result = generateAnnotation("anova", { f: 5.67, dfBetween: 2, dfWithin: 97 }, { p: "0.005", effect: "η² = 0.10", conclusion: "显著" });
      expect(result.oneLiner).toContain("显著差异");
      expect(result.actionItems.some((a) => a.includes("Tukey"))).toBe(true);
    });

    it("non-significant result", () => {
      const result = generateAnnotation("anova", { f: 1.23 }, { p: "0.30", conclusion: "不显著" });
      expect(result.oneLiner).toContain("无显著差异");
    });
  });

  // ===== Chi-square =====
  describe("chi-square", () => {
    it("significant association", () => {
      const result = generateAnnotation("chi-square", { chiSquare: 12.5, df: 4 }, { p: "0.014", conclusion: "显著关联" });
      expect(result.oneLiner).toContain("显著关联");
      expect(result.actionItems.some((a) => a.includes("Cramér"))).toBe(true);
    });

    it("no significant association", () => {
      const result = generateAnnotation("chi-square", { chiSquare: 2.1 }, { p: "0.55", conclusion: "无关联" });
      expect(result.oneLiner).toContain("无显著关联");
    });
  });

  // ===== Pearson / Spearman =====
  describe("correlation", () => {
    for (const testType of ["pearson", "spearman"]) {
      it(`${testType}: significant moderate positive`, () => {
        const result = generateAnnotation(testType, { r: 0.52, rho: 0.52 }, { p: "0.001", conclusion: "显著相关" });
        expect(result.oneLiner).toContain("显著");
        expect(result.oneLiner).toContain("正");
        expect(result.plainExplanation).toContain("中等");
      });

      it(`${testType}: significant strong negative`, () => {
        const result = generateAnnotation(testType, { r: -0.78, rho: -0.78 }, { p: "<.001", conclusion: "显著" });
        expect(result.oneLiner).toContain("负");
        expect(result.plainExplanation).toContain("强");
      });

      it(`${testType}: non-significant weak correlation`, () => {
        const result = generateAnnotation(testType, { r: 0.15, rho: 0.15 }, { p: "0.22", conclusion: "不显著" });
        expect(result.oneLiner).toContain("无显著");
      });
    }
  });

  // ===== Regression =====
  describe("regression", () => {
    it("significant model", () => {
      const result = generateAnnotation("regression", { rSquared: 0.45 }, { p: "<.001", conclusion: "显著" });
      expect(result.oneLiner).toContain("回归模型显著");
      expect(result.oneLiner).toContain("0.45");
      expect(result.actionItems.some((a) => a.includes("VIF"))).toBe(true);
    });

    it("non-significant model", () => {
      const result = generateAnnotation("regression", { rSquared: 0.03 }, { p: "0.18", conclusion: "不显著" });
      expect(result.oneLiner).toContain("不显著");
    });
  });

  // ===== Cronbach's alpha =====
  describe("cronbach", () => {
    it("excellent reliability (α ≥ 0.9)", () => {
      const result = generateAnnotation("cronbach", { alpha: 0.93 }, { p: "N/A", conclusion: "信度" });
      expect(result.oneLiner).toContain("优秀");
      expect(result.practicalImplication).toContain("达标");
    });

    it("acceptable reliability (0.7 ≤ α < 0.8)", () => {
      const result = generateAnnotation("cronbach", { alpha: 0.74 }, { p: "N/A", conclusion: "信度" });
      expect(result.oneLiner).toContain("可接受");
    });

    it("unacceptable reliability (α < 0.6)", () => {
      const result = generateAnnotation("cronbach", { alpha: 0.45 }, { p: "N/A", conclusion: "信度" });
      expect(result.oneLiner).toContain("不可接受");
      expect(result.practicalImplication).toContain("不足");
    });
  });

  // ===== EFA =====
  describe("efa", () => {
    it("good KMO for factor analysis", () => {
      const result = generateAnnotation("efa", { kmo: 0.87 }, { p: "<.001", conclusion: "适合因子分析" });
      expect(result.oneLiner).toContain("良好");
      expect(result.actionItems.some((a) => a.includes("碎石图"))).toBe(true);
    });

    it("poor KMO for factor analysis", () => {
      const result = generateAnnotation("efa", { kmo: 0.48 }, { p: "0.10", conclusion: "不适合" });
      expect(result.oneLiner).toContain("不适合");
    });
  });

  // ===== CFA =====
  describe("cfa", () => {
    it("good model fit", () => {
      const result = generateAnnotation("cfa", { rmsea: 0.04, cfi: 0.97, srmr: 0.03 }, { p: "N/A", conclusion: "拟合良好" });
      expect(result.oneLiner).toContain("良好");
    });

    it("poor model fit", () => {
      const result = generateAnnotation("cfa", { rmsea: 0.12, cfi: 0.82, srmr: 0.10 }, { p: "N/A", conclusion: "拟合不佳" });
      expect(result.oneLiner).toContain("需要改进");
      expect(result.actionItems.some((a) => a.includes("修正指数"))).toBe(true);
    });
  });

  // ===== Mediation =====
  describe("mediation", () => {
    it("significant mediation (CI excludes zero)", () => {
      const result = generateAnnotation("mediation", { indirectEffect: 0.15, ciLower: 0.05, ciUpper: 0.28 }, { p: "N/A", conclusion: "中介显著" });
      expect(result.oneLiner).toContain("显著");
      expect(result.actionItems.some((a) => a.includes("路径图"))).toBe(true);
    });

    it("non-significant mediation (CI includes zero)", () => {
      const result = generateAnnotation("mediation", { indirectEffect: 0.03, ciLower: -0.08, ciUpper: 0.14 }, { p: "N/A", conclusion: "中介不显著" });
      expect(result.oneLiner).toContain("不显著");
    });
  });

  // ===== Moderation =====
  describe("moderation", () => {
    it("significant moderation", () => {
      const result = generateAnnotation("moderation", { interactionP: 0.012 }, { p: "0.012", conclusion: "调节显著" });
      expect(result.oneLiner).toContain("显著");
      expect(result.actionItems.some((a) => a.includes("简单斜率"))).toBe(true);
    });

    it("non-significant moderation", () => {
      const result = generateAnnotation("moderation", { interactionP: 0.35 }, { p: "0.35", conclusion: "调节不显著" });
      expect(result.oneLiner).toContain("不显著");
    });
  });

  // ===== Power =====
  describe("power", () => {
    it("returns required sample size", () => {
      const result = generateAnnotation("power", { requiredN: 128 }, { p: "N/A", conclusion: "功效分析" });
      expect(result.oneLiner).toContain("128");
      expect(result.actionItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===== Effect size =====
  describe("effect-size", () => {
    it("returns Cohen's d interpretation", () => {
      const result = generateAnnotation("effect-size", { cohensD: 0.65 }, { p: "N/A", conclusion: "效应量" });
      expect(result.oneLiner).toContain("0.65");
      expect(result.caveats.some((c) => c.includes("Cohen"))).toBe(true);
    });
  });

  // ===== Bayesian =====
  describe("bayes-ttest / bayes-correlation", () => {
    for (const testType of ["bayes-ttest", "bayes-correlation"]) {
      it(`${testType}: strong evidence for H1`, () => {
        const result = generateAnnotation(testType, { bf10: 25.3 }, { p: "N/A", conclusion: "贝叶斯" });
        expect(result.oneLiner).toContain("强");
        expect(result.oneLiner).toContain("25.3");
      });

      it(`${testType}: weak evidence`, () => {
        const result = generateAnnotation(testType, { bf10: 1.8 }, { p: "N/A", conclusion: "贝叶斯" });
        expect(result.oneLiner).toContain("弱");
      });

      it(`${testType}: no evidence for H1`, () => {
        const result = generateAnnotation(testType, { bf10: 0.4 }, { p: "N/A", conclusion: "贝叶斯" });
        expect(result.oneLiner).toContain("不支持");
      });
    }
  });

  // ===== Default / Unknown =====
  describe("default fallback", () => {
    it("returns generic annotation for unknown test type", () => {
      const result = generateAnnotation("unknown-test", {}, { p: "0.05", conclusion: "测试完成" });
      expect(result.oneLiner).toBe("测试完成");
      expect(result.actionItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===== Edge cases =====
  describe("edge cases", () => {
    it("handles p-value with < prefix", () => {
      const result = generateAnnotation("ttest", { t: 5.0 }, { p: "<.001", effect: "d = 1.2", conclusion: "显著" });
      expect(result.oneLiner).toContain("显著差异");
    });

    it("handles p-value with > prefix", () => {
      const result = generateAnnotation("ttest", { t: 0.5 }, { p: ">0.05", conclusion: "不显著" });
      expect(result.oneLiner).toContain("无显著差异");
    });

    it("handles string effect size in cronbach", () => {
      const result = generateAnnotation("cronbach", { alpha: "0.85" }, { p: "N/A", conclusion: "信度" });
      expect(result.oneLiner).toContain("良好");
    });
  });
});
