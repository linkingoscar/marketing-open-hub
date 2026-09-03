import { describe, it, expect } from "vitest";
import {
  mean,
  median,
  variance,
  stddev,
  se,
  skewness,
  kurtosis,
  q,
  normalCDF,
  gammaFn,
  fDistCDF,
  chiDistCDF,
  pStars,
  rank,
  pearsonCI,
  approximateNormalityP,
  matInv,
  matMul,
} from "./math";

describe("Statistics Math Library", () => {
  describe("Descriptive statistics", () => {
    const sample = [2, 4, 4, 4, 5, 5, 7, 9];

    it("calculates accurate mean", () => {
      expect(mean(sample)).toBe(5);
      expect(mean([])).toBe(0);
    });

    it("calculates accurate median", () => {
      expect(median(sample)).toBe(4.5);
      expect(median([1, 3, 5])).toBe(3);
      expect(median([])).toBe(0);
    });

    it("calculates sample variance and standard deviation", () => {
      // sample variance of [2, 4, 4, 4, 5, 5, 7, 9] with n=8 (sum of sq diff = 32, div by 7 = 4.5714)
      expect(variance(sample)).toBeCloseTo(4.5714, 3);
      expect(stddev(sample)).toBeCloseTo(2.1381, 3);
      expect(se(sample)).toBeCloseTo(2.1381 / Math.sqrt(8), 3);
    });

    it("calculates skewness and kurtosis without exploding", () => {
      const sk = skewness(sample);
      const ku = kurtosis(sample);
      expect(Number.isFinite(sk)).toBe(true);
      expect(Number.isFinite(ku)).toBe(true);
      expect(skewness([1, 1])).toBe(0);
    });

    it("calculates quantiles properly", () => {
      expect(q(sample, 0.5)).toBe(5);
      expect(q([], 0.5)).toBe(0);
    });
  });

  describe("Distributions and probability functions", () => {
    it("normalCDF calculates accurate cumulative probabilities", () => {
      expect(normalCDF(0)).toBeCloseTo(0.5, 4);
      expect(normalCDF(1.96)).toBeCloseTo(0.975, 2);
      expect(normalCDF(-1.96)).toBeCloseTo(0.025, 2);
    });

    it("gammaFn approximates gamma values accurately", () => {
      expect(gammaFn(1)).toBeCloseTo(1, 3);
      expect(gammaFn(2)).toBeCloseTo(1, 3);
      expect(gammaFn(3)).toBeCloseTo(2, 3);
      expect(gammaFn(4)).toBeCloseTo(6, 3);
      expect(gammaFn(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 3);
    });

    it("fDistCDF and chiDistCDF handle edge cases safely", () => {
      expect(fDistCDF(-1, 2, 2)).toBe(0);
      expect(fDistCDF(1, 2, 2)).toBeGreaterThan(0);
      expect(fDistCDF(1, 2, 2)).toBeLessThan(1);

      expect(chiDistCDF(-1, 2)).toBe(0);
      expect(chiDistCDF(2, 2)).toBeGreaterThan(0);
      expect(chiDistCDF(2, 2)).toBeLessThan(1);
    });

    it("pStars formats significance levels accurately", () => {
      expect(pStars(0.0005)).toBe("***");
      expect(pStars(0.005)).toBe("**");
      expect(pStars(0.03)).toBe("*");
      expect(pStars(0.12)).toBe("n.s.");
    });
  });

  describe("Ranks and correlation", () => {
    it("handles tied ranks with mean ranking", () => {
      // 10, 20, 20, 30 -> ranks 1, 2.5, 2.5, 4
      expect(rank([10, 20, 20, 30])).toEqual([1, 2.5, 2.5, 4]);
    });

    it("calculates Pearson correlation confidence intervals", () => {
      const [lo, hi] = pearsonCI(0.6, 50);
      expect(lo).toBeLessThan(0.6);
      expect(hi).toBeGreaterThan(0.6);
      expect(lo).toBeGreaterThan(0);
    });

    it("approximateNormalityP gives continuous smooth p-values", () => {
      const pHigh = approximateNormalityP(0.98, 50);
      const pLow = approximateNormalityP(0.70, 50);
      expect(pHigh).toBeGreaterThan(0.05);
      expect(pLow).toBeLessThan(0.05);
    });
  });

  describe("Linear algebra", () => {
    it("inverts a 2x2 matrix correctly", () => {
      const A = [
        [4, 7],
        [2, 6],
      ];
      const invA = matInv(A);
      const product = matMul(A, invA);

      expect(product[0][0]).toBeCloseTo(1, 4);
      expect(product[0][1]).toBeCloseTo(0, 4);
      expect(product[1][0]).toBeCloseTo(0, 4);
      expect(product[1][1]).toBeCloseTo(1, 4);
    });
  });
});
