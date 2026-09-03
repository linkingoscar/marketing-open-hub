import { mean, median, skewness, kurtosis, approximateNormalityP, fDistCDF } from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

export function runNormalityHeuristic(nums: number[]): {
  stats: Record<string, number>;
  apa: APAReport;
} {
  // 偏度-峰度探索性正态检验近似 (Skewness-Kurtosis Normality Heuristic)
  const n = nums.length;
  const sk = skewness(nums);
  const ku = kurtosis(nums);
  const W = 1 - (sk ** 2 + ku ** 2 / 4) / Math.max(1, n);
  const wStat = Math.max(0, Math.min(1, W));
  const pApprox = approximateNormalityP(wStat, n);
  const normal = pApprox > 0.05;
  const stats = {
    index: +wStat.toFixed(4),
    skewness: +sk.toFixed(4),
    kurtosis: +ku.toFixed(4),
    p_approx: +pApprox.toFixed(4),
  };
  const apa = formatAPA({
    title: "正态性检验（探索性）",
    test: "偏度-峰度正态性检验 (Skewness-Kurtosis Heuristic)",
    statistic: `Index = ${wStat.toFixed(3)} (Skew = ${sk.toFixed(2)}, Kurt = ${ku.toFixed(2)})`,
    df: `N = ${n}`,
    p: `${pApprox < 0.001 ? "< .001" : `= ${pApprox.toFixed(3)}`}`,
    conclusion: normal
      ? "数据分布与正态分布无显著偏离，探索性分析可暂按参数检验前提处理。"
      : "数据分布显著偏离正态分布，建议使用非参数检验方法。",
    interpretation: `正态性检验结果：综合指数 = ${wStat.toFixed(3)}，近似 p ${pApprox < 0.001 ? "< .001" : `= ${pApprox.toFixed(3)}`}。${
      normal
        ? "正态性假设在探索性分析中基本满足。"
        : "正态性假设不成立，后续分析建议采用 Mann-Whitney U、Wilcoxon 或 Kruskal-Wallis 等非参数方法。"
    }（注：当前为基于偏度与峰度的探索性启发式检验，非严格 Shapiro-Wilk 算法）。`,
  });
  return { stats, apa };
}

// 保留历史方法命名以兼容存量调用
export const runShapiroWilk = runNormalityHeuristic;

export function runLevene(groups: number[][]): { stats: Record<string, number>; apa: APAReport } {
  const k = groups.length;
  const N = groups.reduce((s, g) => s + g.length, 0);
  const Zi = groups.map((g) => {
    const med = median(g);
    return g.map((x) => Math.abs(x - med));
  });
  const allZ = Zi.flat();
  const zGrandMean = mean(allZ);
  let ssb = 0;
  let ssw = 0;
  for (const zi of Zi) {
    const zm = mean(zi);
    ssb += zi.length * (zm - zGrandMean) ** 2;
    ssw += zi.reduce((s, z) => s + (z - zm) ** 2, 0);
  }
  const dfb = Math.max(1, k - 1);
  const dfw = Math.max(1, N - k);
  const F = ssb / dfb / (ssw / dfw || 1e-12);
  const p = 1 - fDistCDF(F, dfb, dfw);
  const equal = p > 0.05;
  const stats = { F: +F.toFixed(4), df_between: dfb, df_within: dfw, p: +p.toFixed(6) };
  const apa = formatAPA({
    title: "方差齐性检验",
    test: "Levene's",
    statistic: `F(${dfb}, ${dfw}) = ${F.toFixed(2)}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    conclusion: equal
      ? "各组方差齐性假设成立，满足 ANOVA 前提。"
      : "各组方差不齐，建议使用 Welch's ANOVA 或非参数方法。",
    interpretation: `Levene's 方差齐性检验 F(${dfb}, ${dfw}) = ${F.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。${
      equal ? "方差齐性假设成立。" : "方差齐性假设不成立。"
    }`,
  });
  return { stats, apa };
}
