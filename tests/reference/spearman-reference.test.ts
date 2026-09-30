import { describe, expect, it } from "vitest";
import { runSpearman } from "@/lib/statistics";

// Verified with SciPy 1.18.1. Exact reference: scipy.stats.permutation_test((y,),
//   lambda yp: abs(scipy.stats.spearmanr(x, yp).statistic),
//   permutation_type="pairings", n_resamples=np.inf, alternative="greater").
// This defines two-sided extremeness by |rho| (not twice the smaller one-sided tail).
// See https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html
// The small cases also have directly enumerable combinatorial reference probabilities.
describe("Spearman exact pairing-permutation inference", () => {
  it.each([1, -1])("does not call a perfect three-pair sample significant (%s)", (sign) => {
    const { stats, apa } = runSpearman(
      [1, 2, 3],
      [1, 2, 3].map((v) => sign * v)
    );
    expect(stats.p).toBeCloseTo(2 / 6, 6);
    expect(apa.conclusion).toContain("无显著");
    expect(apa.test).toContain("精确配对置换");
    expect(stats.t).toBeUndefined();
    expect(stats.df).toBeUndefined();
  });
  it("counts tied observation permutations with their multiplicity", () => {
    // 2 of 6 labeled permutations have |rho| = 1; the others have |rho| = .5.
    const { stats } = runSpearman([1, 1, 2], [1, 1, 2]);
    expect(stats.rho).toBe(1);
    expect(stats.p).toBeCloseTo(1 / 3, 6);
  });
  it("uses an absolute tail even when ties make the null distribution asymmetric", () => {
    // 6 of 24 labeled permutations have rho = 1; 18 have rho = -1/3.
    const { stats } = runSpearman([1, 1, 1, 2], [1, 1, 1, 2]);
    expect(stats.p).toBe(0.25);
  });
  it("returns p = 1 at zero rank correlation", () => {
    const { stats } = runSpearman([1, 1, 2, 2], [1, 2, 1, 2]);
    expect(stats.rho).toBe(0);
    expect(stats.p).toBe(1);
  });
  it("evaluates all 9! permutations at the exact cutoff", () => {
    const values = Array.from({ length: 9 }, (_, i) => i + 1);
    const { stats, apa } = runSpearman(values, values);
    expect(stats.p).toBeCloseTo(2 / 362880, 6);
    expect(stats.p).toBeGreaterThan(0);
    expect(apa.test).toContain("精确");
  });
  it("labels larger-sample Student t inference as approximate", () => {
    const x = Array.from({ length: 10 }, (_, i) => i + 1);
    const y = [1, 3, 2, 5, 4, 7, 6, 10, 9, 8];
    const { stats, apa } = runSpearman(x, y);
    // scipy.stats.spearmanr(x, y): Student t approximation, df = 8.
    expect(stats.rho).toBeCloseTo(0.915151515151515, 4);
    expect(stats.df).toBe(8);
    expect(stats.p).toBeCloseTo(0.00020447240614883226, 5);
    expect(apa.test).toContain("Student t 渐近近似");
    expect(apa.interpretation).toContain("建议置换检验");
    expect(Object.values(stats).every(Number.isFinite)).toBe(true);
  });
});
