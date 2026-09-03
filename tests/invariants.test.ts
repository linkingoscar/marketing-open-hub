import { describe, it, expect } from "vitest";
import {
  mean,
  stddev,
  variance,
  normalCDF,
  tDistCDF,
  fDistCDF,
  chiDistCDF,
  runPearson,
  runDescriptive,
} from "@/lib/statistics";

describe("Mathematical & Statistical Property Invariant Tests (OSQ-016)", () => {
  describe("1. Sample Variance and Standard Deviation Properties", () => {
    it("variance is strictly non-negative for any real vector", () => {
      const randomVectors = [
        [1, 5, 9, -3, 14, 2.5],
        [-100, -50, 0, 50, 100],
        [0.0001, 0.0002, 0.0003],
        Array.from({ length: 50 }, (_, i) => Math.sin(i) * 100),
      ];

      for (const vec of randomVectors) {
        const v = variance(vec);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(v)).toBe(true);
      }
    });

    it("variance is 0 for identical constant elements", () => {
      const constantVec = [42, 42, 42, 42, 42];
      expect(variance(constantVec)).toBe(0);
      expect(stddev(constantVec)).toBe(0);
    });

    it("satisfies translation invariance: SD(X + c) == SD(X) and Mean(X + c) == Mean(X) + c", () => {
      const base = [10, 20, 30, 40, 50];
      const shift = 1000;
      const shifted = base.map((x) => x + shift);

      expect(mean(shifted)).toBeCloseTo(mean(base) + shift, 6);
      expect(stddev(shifted)).toBeCloseTo(stddev(base), 6);
      expect(variance(shifted)).toBeCloseTo(variance(base), 6);
    });

    it("satisfies scale equivariance: SD(c * X) == |c| * SD(X)", () => {
      const base = [2, 4, 6, 8, 10];
      const factor = -3;
      const scaled = base.map((x) => x * factor);

      expect(stddev(scaled)).toBeCloseTo(Math.abs(factor) * stddev(base), 6);
    });
  });

  describe("2. Cumulative Distribution Functions (CDF) Invariants", () => {
    it("normalCDF is bounded in [0, 1] and strictly monotonically non-decreasing", () => {
      const grid = [-10, -5, -3, -1.96, -1, 0, 1, 1.96, 3, 5, 10];
      let prev = -1;

      for (const x of grid) {
        const p = normalCDF(x);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
        expect(p).toBeGreaterThanOrEqual(prev);
        prev = p;
      }

      // Symmetry about 0
      expect(normalCDF(0)).toBeCloseTo(0.5, 6);
      expect(normalCDF(-1.96) + normalCDF(1.96)).toBeCloseTo(1.0, 4);
    });

    it("tDistCDF is bounded in [0, 1], symmetric at 0, and non-decreasing", () => {
      const dfs = [1, 5, 10, 30, 100];
      for (const df of dfs) {
        expect(tDistCDF(0, df)).toBeCloseTo(0.5, 4);
        const p1 = tDistCDF(-2, df);
        const p2 = tDistCDF(0, df);
        const p3 = tDistCDF(2, df);
        expect(p1).toBeLessThan(p2);
        expect(p2).toBeLessThan(p3);
        expect(p1 + p3).toBeCloseTo(1.0, 3);
      }
    });

    it("fDistCDF is bounded in [0, 1] and 0 for non-positive values", () => {
      expect(fDistCDF(-1, 2, 10)).toBe(0);
      expect(fDistCDF(0, 2, 10)).toBe(0);

      const grid = [0.1, 1.0, 2.5, 5.0, 20.0];
      let prev = 0;
      for (const f of grid) {
        const p = fDistCDF(f, 3, 12);
        expect(p).toBeGreaterThanOrEqual(prev);
        expect(p).toBeLessThanOrEqual(1);
        prev = p;
      }
    });

    it("chiDistCDF is bounded in [0, 1] and 0 for non-positive values", () => {
      expect(chiDistCDF(-5, 2)).toBe(0);
      expect(chiDistCDF(0, 2)).toBe(0);

      const grid = [0.5, 2.0, 5.99, 10.0, 25.0];
      let prev = 0;
      for (const x of grid) {
        const p = chiDistCDF(x, 2);
        expect(p).toBeGreaterThanOrEqual(prev);
        expect(p).toBeLessThanOrEqual(1);
        prev = p;
      }
    });
  });

  describe("3. Correlation Coefficient Properties", () => {
    it("Pearson r is strictly bounded in [-1, 1]", () => {
      const x = [1, 2, 3, 4, 5, 6, 7];
      const y1 = [7, 6, 5, 4, 3, 2, 1]; // Perfect negative
      const y2 = [1, 3, 2, 5, 4, 7, 6]; // Arbitrary

      const resPerfectNeg = runPearson(x, y1);
      expect(resPerfectNeg.stats.r).toBeCloseTo(-1.0, 4);

      const resArbitrary = runPearson(x, y2);
      expect(resArbitrary.stats.r as number).toBeGreaterThanOrEqual(-1.0);
      expect(resArbitrary.stats.r as number).toBeLessThanOrEqual(1.0);
    });

    it("Pearson self-correlation r(X, X) is identically 1.0", () => {
      const x = [12, 45, 23, 67, 89, 34];
      const res = runPearson(x, x);
      expect(res.stats.r).toBeCloseTo(1.0, 6);
      expect(res.stats.r_squared).toBeCloseTo(1.0, 6);
    });
  });

  describe("4. Robustness on Boundary & Degenerate Inputs", () => {
    it("handles single-value and constant data safely without crashing", () => {
      const constantData = [5, 5, 5, 5, 5];
      const res = runDescriptive(constantData);

      expect(res.stats.N).toBe(5);
      expect(res.stats.Mean).toBe(5);
      expect(res.stats.SD).toBe(0);
      expect(res.stats.Variance).toBe(0);
      expect(res.stats.Skewness).toBe(0);
    });
  });
});
