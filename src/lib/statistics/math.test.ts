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
  logGamma,
  regIncGamma,
  fDistCDF,
  chiDistCDF,
  pStars,
  rank,
  pearsonCI,
  approximateNormalityP,
  tDistCDF,
  tDistQuantile,
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

      expect(logGamma(1)).toBeCloseTo(0, 3);
      expect(logGamma(2)).toBeCloseTo(0, 3);
      expect(logGamma(5)).toBeCloseTo(Math.log(24), 3);
      expect(regIncGamma(1, 1)).toBeCloseTo(1 - Math.exp(-1), 4);
    });

    it("fDistCDF and chiDistCDF handle edge cases safely", () => {
      expect(fDistCDF(-1, 2, 2)).toBe(0);
      expect(fDistCDF(1, 2, 2)).toBeGreaterThan(0);
      expect(fDistCDF(1, 2, 2)).toBeLessThan(1);

      expect(chiDistCDF(-1, 2)).toBe(0);
      expect(chiDistCDF(0, 2)).toBe(0);
    });

    it("chiDistCDF computes accurate probabilities against theoretical critical values", () => {
      // chi2(2) at x=2 is exactly 1 - 1/e ≈ 0.63212
      expect(chiDistCDF(2, 2)).toBeCloseTo(1 - Math.exp(-1), 4);

      // Theoretical 95% critical values:
      // chi2(1) = 3.8414588 => CDF ≈ 0.95
      expect(chiDistCDF(3.8414588, 1)).toBeCloseTo(0.95, 3);

      // chi2(2) = 5.9914645 => CDF ≈ 0.95
      expect(chiDistCDF(5.9914645, 2)).toBeCloseTo(0.95, 3);

      // chi2(10) = 18.307038 => CDF ≈ 0.95
      expect(chiDistCDF(18.307038, 10)).toBeCloseTo(0.95, 3);

      // Monotonicity check
      expect(chiDistCDF(3, 2)).toBeGreaterThan(chiDistCDF(2, 2));
      expect(chiDistCDF(4, 2)).toBeGreaterThan(chiDistCDF(3, 2));
    });

    it("tDistCDF and tDistQuantile match theoretical Student t values", () => {
      // t(10) at t=0 is 0.5
      expect(tDistCDF(0, 10)).toBe(0.5);
      expect(tDistQuantile(0.5, 10)).toBe(0);

      // t(1) at t=1 is 0.75 (Cauchy, singularity at endpoints)
      expect(tDistCDF(1, 1)).toBeCloseTo(0.75, 2);
      expect(tDistQuantile(0.75, 1)).toBeCloseTo(1, 1);

      // 95% two-tailed critical value: p=0.975
      // df = 14: t_crit ≈ 2.1448
      const tCrit14 = tDistQuantile(0.975, 14);
      expect(tCrit14).toBeCloseTo(2.1448, 2);
      expect(tDistCDF(tCrit14, 14)).toBeCloseTo(0.975, 4);

      // df = 30: t_crit ≈ 2.0423
      const tCrit30 = tDistQuantile(0.975, 30);
      expect(tCrit30).toBeCloseTo(2.0423, 2);
      expect(tDistCDF(tCrit30, 30)).toBeCloseTo(0.975, 4);

      // Inversion symmetry
      expect(tDistQuantile(0.025, 14)).toBeCloseTo(-2.1448, 2);
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
      const pLow = approximateNormalityP(0.7, 50);
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
