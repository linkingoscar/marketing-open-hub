import { mean, rank, tDistCDF, normalCDF, pearsonCI, pStars } from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

export function runPearson(
  x: number[],
  y: number[]
): { stats: Record<string, number>; apa: APAReport } {
  const n = x.length;
  const mx = mean(x),
    my = mean(y);
  let num = 0,
    dx2 = 0,
    dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx,
      dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  const r = denom > 0 ? num / denom : 0;
  const df = Math.max(1, n - 2);
  const t = 1 - r * r > 0 ? r * Math.sqrt(df / (1 - r * r)) : 0;
  const p = 2 * (1 - tDistCDF(Math.abs(t), df));
  const rSq = r * r;
  const ci = pearsonCI(r, n);
  const strength =
    Math.abs(r) < 0.1
      ? "极弱"
      : Math.abs(r) < 0.3
        ? "弱"
        : Math.abs(r) < 0.5
          ? "中等"
          : Math.abs(r) < 0.7
            ? "强"
            : "极强";
  const stats = {
    r: +r.toFixed(4),
    r_squared: +rSq.toFixed(4),
    t: +t.toFixed(4),
    df: Math.max(1, n - 2),
    p: +p.toFixed(6),
    CI_95_low: ci[0],
    CI_95_high: ci[1],
    n,
  };
  const apa = formatAPA({
    title: "Pearson 相关分析",
    test: "Pearson's r",
    statistic: `r(${Math.max(1, n - 2)}) = ${r.toFixed(3)}`,
    df: `${Math.max(1, n - 2)}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `R² = ${rSq.toFixed(2)}（解释 ${(rSq * 100).toFixed(1)}% 方差）`,
    ci: `95% CI [${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]`,
    conclusion:
      p < 0.05
        ? `两变量间存在显著的${r > 0 ? "正" : "负"}相关（${strength}，${pStars(p)}）。`
        : "两变量间无显著线性相关。",
    interpretation: `Pearson 相关分析结果表明，两变量间${p < 0.05 ? "存在显著的" : "不存在显著的"}${
      r > 0 ? "正" : "负"
    }线性相关，r(${Math.max(1, n - 2)}) = ${r.toFixed(3)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，95% CI [${ci[0].toFixed(
      3
    )}, ${ci[1].toFixed(3)}]。R² = ${rSq.toFixed(2)}，表明一个变量可解释另一个变量 ${(rSq * 100).toFixed(1)}% 的变异。`,
  });
  return { stats, apa };
}

export function runSpearman(
  x: number[],
  y: number[]
): { stats: Record<string, number>; apa: APAReport } {
  const n = x.length;
  const rx = rank(x),
    ry = rank(y);
  const mx = mean(rx),
    my = mean(ry);
  let num = 0,
    dx2 = 0,
    dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - mx,
      dy = ry[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  const rho = denom > 0 ? num / denom : 0;
  const t = 1 - rho * rho > 0 ? rho * Math.sqrt(Math.max(1, n - 2) / (1 - rho * rho)) : 0;
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  const stats = {
    rho: +rho.toFixed(4),
    t: +t.toFixed(4),
    df: Math.max(1, n - 2),
    p: +p.toFixed(6),
    n,
  };
  const apa = formatAPA({
    title: "Spearman 秩相关",
    test: "Spearman's ρ",
    statistic: `ρ(${Math.max(1, n - 2)}) = ${rho.toFixed(3)}`,
    df: `${Math.max(1, n - 2)}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    conclusion:
      p < 0.05 ? `两变量间存在显著的${rho > 0 ? "正" : "负"}秩相关。` : "两变量间无显著秩相关。",
    interpretation: `Spearman 秩相关分析（N = ${n}）结果显示 ρ = ${rho.toFixed(3)}，p ${
      p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
    }。`,
  });
  return { stats, apa };
}
