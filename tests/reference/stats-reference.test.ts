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
    it("matches standard moments on textbook dataset", () => {
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
  });

  describe("2. Student's Independent Two-Sample t-Test", () => {
    it("reproduces R / SciPy t-statistic, df, and p-value on benchmark data", () => {
      // Group 1: n = 8, Group 2: n = 8
      const g1 = [25, 28, 30, 32, 27, 29, 31, 33];
      const g2 = [18, 20, 22, 19, 21, 23, 20, 22];

      const { stats } = runTTest(g1, g2);

      expect(stats.group1_n).toBe(8);
      expect(stats.group2_n).toBe(8);
      expect(stats.df).toBe(14);
      expect(stats.group1_mean).toBeCloseTo(29.375, 3);
      expect(stats.group2_mean).toBeCloseTo(20.625, 3);

      // t should be approximately 7.84
      expect(stats.t as number).toBeCloseTo(7.84, 1);
      // p-value is extremely small (< 0.0001)
      expect(stats.p as number).toBeLessThan(0.0001);
      // Cohen's d > 3.0 (large effect)
      expect(stats.cohens_d as number).toBeGreaterThan(3.0);
    });
  });

  describe("3. Paired Samples t-Test", () => {
    it("accurately detects paired difference", () => {
      const before = [20, 22, 19, 24, 25, 21, 23, 20];
      const after = [25, 27, 24, 30, 29, 26, 28, 25];

      const { stats } = runPairedTTest(before, after);

      expect(stats.n_pairs).toBe(8);
      expect(stats.mean_diff).toBeCloseTo(5.0, 3);
      expect(stats.t as number).toBeGreaterThan(15);
      expect(stats.p as number).toBeLessThan(0.0001);
    });
  });

  describe("4. One-Way ANOVA (F-Test)", () => {
    it("matches exact F-statistic and p-value from textbook dataset", () => {
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
  });

  describe("5. Chi-Square Test of Independence", () => {
    it("matches analytical 2x2 contingency table chi-square and p-value", () => {
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
  });

  describe("6. Pearson Correlation", () => {
    it("calculates accurate Pearson r and Fisher z confidence interval", () => {
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
  });

  describe("7. Mann-Whitney U Non-parametric Test", () => {
    it("handles completely separated groups (U=0)", () => {
      const g1 = [1, 2, 3, 4, 5];
      const g2 = [6, 7, 8, 9, 10];

      const { stats } = runMannWhitney(g1, g2);

      expect(stats.U).toBe(0);
      expect(stats.p).toBeLessThan(0.01);
    });
  });

  describe("8. Scale Reliability (Cronbach's Alpha)", () => {
    it("yields 1.0 for perfectly correlated items", () => {
      const items = [
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 5],
      ];

      const { stats } = runCronbach(items);

      expect(stats.items).toBe(3);
      expect(stats.Cronbach_alpha).toBeCloseTo(1.0, 3);
    });
  });
});
