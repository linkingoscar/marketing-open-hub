import { describe, expect, it } from "vitest";
import { runPearson, runSpearman } from "@/lib/statistics";

for (const [name, run, coefficient] of [
  ["Pearson", runPearson, "r"],
  ["Spearman", runSpearman, "rho"],
] as const) {
  describe(`${name} correlation boundaries`, () => {
    for (const sign of [1, -1]) {
      it(`handles perfect ${sign === 1 ? "positive" : "negative"} correlation`, () => {
        const { stats, apa } = run(
          [1, 2, 3, 4, 5],
          [1, 2, 3, 4, 5].map((v) => sign * v)
        );
        expect(stats[coefficient]).toBe(sign);
        expect(stats.p).toBeCloseTo(name === "Pearson" ? 0 : 1 / 60, 6);
        expect(stats.t).toBeUndefined();
        expect(JSON.parse(JSON.stringify(stats))).toEqual(stats);
        expect(apa.conclusion).toContain("显著");
      });
    }
    it("accepts the minimum three paired observations", () => {
      const { stats } = run([1, 2, 3], [3, 2, 1]);
      expect(stats.n).toBe(3);
      if (name === "Pearson") {
        expect(stats.df).toBe(1);
        expect(stats.p).toBe(0);
        expect([stats.CI_95_low, stats.CI_95_high]).toEqual([-1, 1]);
      } else {
        expect(stats.p).toBeCloseTo(1 / 3, 6);
      }
    });
    for (const values of [[], [1], [1, 2]]) {
      it(`rejects ${values.length} pairs`, () => {
        expect(() => run(values, values)).toThrow(/至少 3/);
      });
    }
    it("rejects unequal lengths", () => {
      expect(() => run([1, 2, 3], [1, 2, 3, 4])).toThrow(/相同/);
    });
    it.each([NaN, Infinity, -Infinity])("rejects non-finite input %s", (value) => {
      expect(() => run([1, 2, value], [1, 2, 3])).toThrow(/有限/);
      expect(() => run([1, 2, 3], [1, value, 3])).toThrow(/有限/);
    });
    it.each([0, 0.1, 7])(
      "rejects a constant column (%s) instead of reporting no correlation",
      (value) => {
        expect(() => run([value, value, value], [1, 2, 3])).toThrow(/常数/);
        expect(() => run([1, 2, 3], [value, value, value])).toThrow(/常数/);
      }
    );
    it("does not mutate the input", () => {
      const x = [3, 1, 2];
      const y = [5, 4, 6];
      run(x, y);
      expect(x).toEqual([3, 1, 2]);
      expect(y).toEqual([5, 4, 6]);
    });
  });
}

describe("Pearson floating-point boundaries", () => {
  it.each([1, -1])("keeps near-perfect correlations in range (%s)", (sign) => {
    const { stats } = runPearson(
      [0.1, 0.2, 0.3, 0.4, 0.5],
      [0.3, 0.6, 0.9, 1.2, 1.500000001].map((v) => v * sign)
    );
    expect(Math.abs(stats.r)).toBeLessThanOrEqual(1);
    expect(stats.p).toBeGreaterThanOrEqual(0);
    expect(stats.p).toBeLessThan(0.001);
    expect(Number.isNaN(stats.t)).toBe(false);
  });
  it.each([1e200, 1e-200])("avoids overflow and underflow at scale %s", (scale) => {
    const { stats } = runPearson(
      [1, 2, 3, 4].map((v) => v * scale),
      [4, 3, 2, 1].map((v) => v * scale)
    );
    expect(stats.r).toBe(-1);
    expect(stats.p).toBe(0);
  });
});

describe("Pearson perfect-correlation confidence limits", () => {
  it.each([1, -1])("returns the Fisher limit for perfect correlation (%s)", (sign) => {
    const { stats } = runPearson(
      [1, 2, 3, 4, 5],
      [1, 2, 3, 4, 5].map((v) => sign * v)
    );
    expect([stats.CI_95_low, stats.CI_95_high]).toEqual([sign, sign]);
  });
});
