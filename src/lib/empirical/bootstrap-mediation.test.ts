import { describe, it, expect } from "vitest";
import { runBootstrapMediation } from "./bootstrap-mediation";

describe("Hayes Model 4 Bootstrap Mediation Engine", () => {
  it("detects strong positive mediation with non-zero bootstrap CI", () => {
    // Generate synthetic dataset with strong mediation: X -> M -> Y
    const n = 100;
    const x: number[] = [];
    const m: number[] = [];
    const y: number[] = [];

    for (let i = 0; i < n; i++) {
      const xi = (i - n / 2) / 10;
      const mi = 0.7 * xi + Math.sin(i) * 0.2; // strong a path
      const yi = 0.6 * mi + Math.cos(i) * 0.2; // strong b path, weak c' path
      x.push(xi);
      m.push(mi);
      y.push(yi);
    }

    const result = runBootstrapMediation({
      x,
      m,
      y,
      bootstraps: 500,
      confidenceLevel: 0.95,
    });

    expect(result.n).toBe(100);
    expect(result.pathA.effect).toBeGreaterThan(0.5);
    expect(result.pathB.effect).toBeGreaterThan(0.4);
    expect(result.indirectEffect.effect).toBeGreaterThan(0.2);

    // Bootstrap confidence intervals should be strictly positive (does not include 0)
    expect(result.indirectEffect.bootLLCI).toBeGreaterThan(0);
    expect(result.indirectEffect.bootULCI).toBeGreaterThan(result.indirectEffect.bootLLCI);
    expect(result.indirectEffect.significant).toBe(true);
    expect(result.apaSummary).toContain("Bootstrap 95% 置信区间");
    expect(result.tableData.length).toBe(4);
  });

  it("throws an error when sample size is too small", () => {
    expect(() => {
      runBootstrapMediation({
        x: [1, 2],
        m: [2, 3],
        y: [3, 4],
      });
    }).toThrow("中介效应分析至少需要 5 个有效观测样本");
  });
});
