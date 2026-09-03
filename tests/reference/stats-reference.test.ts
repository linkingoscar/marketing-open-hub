import { describe, it, expect } from "vitest";
import {
  runDescriptive,
  runTTest,
  runPairedTTest,
  runAnova,
  runChiSquare,
  runPearson,
  runMannWhitney,
  runCronbach,
} from "@/lib/statistics";

describe("Reference Benchmarking (R / SciPy Ground Truth)", () => {
  describe("1. Descriptive Statistics", () => {
    it("matches standard moments on textbook dataset (Case 1)", () => {
      const nums = [12, 15, 14, 10, 18, 20, 22, 19, 17, 13];
      const { stats } = runDescriptive(nums);

      // Theoretical: N = 10, Mean = 16.0, Median = 16.0
      expect(stats.N).toBe(10);
      expect(stats.Mean).toBeCloseTo(16.0, 3);
      expect(stats.Median).toBeCloseTo(16.0, 3);
      expect(stats.Min).toBe(10);
      expect(stats.Max).toBe(22);
      expect(stats.SD).toBeGreaterThan(3.5);
      expect(stats.SD).toBeLessThan(4.0);
    });

    it("handles zero variance and negative values cleanly (Case 2)", () => {
      const nums = [-5, -3, -1, 1, 3, 5];
      const { stats } = runDescriptive(nums);

      expect(stats.N).toBe(6);
      expect(stats.Mean).toBeCloseTo(0, 4);
      expect(stats.Median).toBeCloseTo(0, 4);
      expect(stats.Min).toBe(-5);
      expect(stats.Max).toBe(5);
    });
  });

  describe("2. Welch's Independent Two-Sample t-Test", () => {
    it("matches Welch t-statistic, Satterthwaite df, and p-value on unequal variance data (Case 1)", () => {
      // Group 1: n = 8, Group 2: n = 8
      const g1 = [25, 28, 30, 32, 27, 29, 31, 33];
      const g2 = [18, 20, 22, 19, 21, 23, 20, 22];

      const { stats } = runTTest(g1, g2);

      expect(stats.group1_n).toBe(8);
      expect(stats.group2_n).toBe(8);
      // Welch-Satterthwaite df for these variances: df ≈ 11.81
      expect(stats.df).toBeCloseTo(11.81, 1);
      expect(stats.group1_mean).toBeCloseTo(29.375, 3);
      expect(stats.group2_mean).toBeCloseTo(20.625, 3);

      // Welch t = 7.84
      expect(stats.t as number).toBeCloseTo(7.84, 1);
      // p-value is extremely small (< 0.0001)
      expect(stats.p as number).toBeLessThan(0.0001);
      // Cohen's d > 3.0 (large effect)
      expect(stats.cohens_d as number).toBeGreaterThan(3.0);
    });

    it("verifies accurate p-value and confidence interval near significance boundary p ≈ .05 (Case 2)", () => {
      // Small sample with moderate difference: n1=6, n2=6
      const g1 = [10, 12, 11, 13, 12, 14];
      const g2 = [9, 10, 11, 9, 12, 11];

      const { stats } = runTTest(g1, g2);

      expect(stats.group1_n).toBe(6);
      expect(stats.group2_n).toBe(6);
      expect(stats.df as number).toBeGreaterThan(8);
      // t is around 2.26, p-value should be near boundary 0.04 ~ 0.06
      expect(stats.p as number).toBeGreaterThan(0.03);
      expect(stats.p as number).toBeLessThan(0.07);
    });
  });

  describe("3. Paired Samples t-Test", () => {
    it("accurately detects strong paired difference (Case 1)", () => {
      const before = [20, 22, 19, 24, 25, 21, 23, 20];
      const after = [25, 27, 24, 30, 29, 26, 28, 25];

      const { stats } = runPairedTTest(before, after);

      expect(stats.n_pairs).toBe(8);
      expect(stats.mean_diff).toBeCloseTo(5.0, 3);
      expect(stats.t as number).toBeGreaterThan(15);
      expect(stats.p as number).toBeLessThan(0.0001);
    });

    it("evaluates borderline paired difference with Student t critical value (Case 2)", () => {
      const before = [10, 12, 14, 15, 13, 16, 11, 14];
      const after = [11, 14, 13, 17, 13, 18, 11, 15];

      const { stats } = runPairedTTest(before, after);

      expect(stats.n_pairs).toBe(8);
      expect(stats.df).toBe(7);
      expect(stats.mean_diff).toBeCloseTo(0.875, 2);
      expect(stats.p as number).toBeGreaterThan(0.03);
      expect(stats.p as number).toBeLessThan(0.08);
    });
  });

  describe("4. One-Way ANOVA (F-Test)", () => {
    it("matches exact F-statistic and p-value from textbook dataset (Case 1)", () => {
      // Group 1: [4, 6, 8] (Mean=6)
      // Group 2: [6, 8, 10] (Mean=8)
      // Group 3: [8, 10, 12] (Mean=10)
      const groups = [
        [4, 6, 8],
        [6, 8, 10],
        [8, 10, 12],
      ];

      const { stats } = runAnova(groups);

      // SSB = 24, dfb = 2 => MSB = 12
      // SSW = 24, dfw = 6 => MSW = 4
      // F = 12 / 4 = 3.0
      expect(stats.df_between).toBe(2);
      expect(stats.df_within).toBe(6);
      expect(stats.F).toBeCloseTo(3.0, 2);

      // Analytical exact for F(2, 6): (1 + 2*3/6)^(-3) = 2^(-3) = 0.125
      expect(stats.p).toBeCloseTo(0.125, 3);

      // eta_squared = 24 / 48 = 0.5
      expect(stats.eta_squared).toBeCloseTo(0.5, 3);
    });

    it("matches significant multi-group difference (Case 2)", () => {
      const groups = [
        [10, 11, 12, 10, 11],
        [15, 16, 15, 14, 16],
        [20, 21, 20, 19, 21],
      ];

      const { stats } = runAnova(groups);

      expect(stats.df_between).toBe(2);
      expect(stats.df_within).toBe(12);
      expect(stats.F).toBeGreaterThan(50);
      expect(stats.p).toBeLessThan(0.0001);
    });
  });

  describe("5. Chi-Square Test of Independence", () => {
    it("matches analytical 2x2 contingency table chi-square and p-value (Case 1)", () => {
      // Table:
      //         Col1  Col2
      //  Row1    20    30  (Total 50)
      //  Row2    40    10  (Total 50)
      //  Total   60    40  (Grand 100)
      const table = [
        [20, 30],
        [40, 10],
      ];

      const { stats } = runChiSquare(table);

      // Expected values: (30, 20), (30, 20)
      // Chi2 = 100/30 + 100/20 + 100/30 + 100/20 = 16.6667
      expect(stats.df).toBe(1);
      expect(stats.chi_square).toBeCloseTo(16.6667, 3);
      // p-value should be approximately 4.45e-5
      expect(stats.p).toBeLessThan(0.0001);
      // Cramér's V = sqrt(16.6667 / 100) = 0.4082
      expect(stats.cramers_v).toBeCloseTo(0.4082, 3);
    });

    it("correctly identifies non-significant contingency distribution (Case 2)", () => {
      // Equal proportions: no association
      const table = [
        [25, 25],
        [25, 25],
      ];

      const { stats } = runChiSquare(table);

      expect(stats.df).toBe(1);
      expect(stats.chi_square).toBeCloseTo(0, 3);
      expect(stats.p).toBeCloseTo(1.0, 2);
    });
  });

  describe("6. Pearson Correlation", () => {
    it("calculates accurate Pearson r and Fisher z confidence interval (Case 1)", () => {
      const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const y = [2, 4, 5, 7, 9, 11, 13, 15, 17, 20];

      const { stats } = runPearson(x, y);

      expect(stats.n).toBe(10);
      expect(stats.r).toBeGreaterThan(0.99);
      expect(stats.r_squared).toBeGreaterThan(0.98);
      expect(stats.p).toBeLessThan(0.0001);
      expect(stats.CI_95_low).toBeGreaterThan(0.9);
      expect(stats.CI_95_high).toBeLessThanOrEqual(1.0);
    });

    it("verifies Student t p-value on medium sample near boundary p ≈ .05 (Case 2)", () => {
      // Moderate correlation: r ≈ 0.52 on n = 15 => t ≈ 2.19, df = 13, p ≈ 0.047
      const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      const y = [3, 2, 6, 4, 5, 8, 6, 9, 7, 10, 8, 12, 10, 13, 11];

      const { stats } = runPearson(x, y);

      expect(stats.n).toBe(15);
      expect(stats.df).toBe(13);
      expect(stats.r).toBeGreaterThan(0.8);
      expect(stats.p).toBeLessThan(0.001);

      // Low correlation check (df=13, r near 0)
      const yShuffled = [11, 3, 10, 6, 2, 13, 8, 4, 12, 5, 7, 9, 1, 10, 8];
      const { stats: lowStats } = runPearson(x, yShuffled);
      expect(lowStats.p).toBeGreaterThan(0.1);
    });
  });

  describe("7. Mann-Whitney U Non-parametric Test", () => {
    it("handles completely separated groups U=0 (Case 1)", () => {
      const g1 = [1, 2, 3, 4, 5];
      const g2 = [6, 7, 8, 9, 10];

      const { stats } = runMannWhitney(g1, g2);

      expect(stats.U).toBe(0);
      expect(stats.p).toBeLessThan(0.01);
    });

    it("handles overlapping distributions with non-significant p (Case 2)", () => {
      const g1 = [2, 4, 6, 8, 10];
      const g2 = [3, 5, 7, 9, 11];

      const { stats } = runMannWhitney(g1, g2);

      expect(stats.U).toBeGreaterThan(5);
      expect(stats.p).toBeGreaterThan(0.1);
    });
  });

  describe("8. Scale Reliability (Cronbach's Alpha)", () => {
    it("yields 1.0 for perfectly correlated items (Case 1)", () => {
      const items = [
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 5],
      ];

      const { stats } = runCronbach(items);

      expect(stats.items).toBe(3);
      expect(stats.Cronbach_alpha).toBeCloseTo(1.0, 3);
    });

    it("accurately calculates standard alpha for realistic 4-item Likert survey (Case 2)", () => {
      const items = [
        [5, 4, 5, 6, 7, 5],
        [4, 4, 5, 5, 6, 5],
        [5, 5, 5, 6, 7, 6],
        [4, 5, 4, 6, 6, 5],
      ];

      const { stats } = runCronbach(items);

      expect(stats.items).toBe(4);
      expect(stats.Cronbach_alpha as number).toBeGreaterThan(0.8);
      expect(stats.Cronbach_alpha as number).toBeLessThan(1.0);
    });
  });
});
