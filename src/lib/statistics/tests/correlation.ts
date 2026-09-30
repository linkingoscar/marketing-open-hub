import { mean, rank, tDistCDF, pearsonCI, pStars } from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

function validatePairs(x: number[], y: number[]): void {
  if (x.length !== y.length) throw new Error("两列数值必须包含相同数量的配对观测");
  if (x.length < 3) throw new Error("需要至少 3 个配对观测");
  if (!x.every(Number.isFinite) || !y.every(Number.isFinite)) {
    throw new Error("配对观测必须全部为有限数值");
  }
  if (x.every((v) => v === x[0]) || y.every((v) => v === y[0])) {
    throw new Error("常数列无法计算相关系数，请选择有变异的数值列");
  }
}

function correlation(x: number[], y: number[]): number {
  // Rescale before centering to avoid overflowing sums/products for finite inputs.
  const scale = (values: number[]) => {
    const max = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    return values.map((v) => v / max);
  };
  const xs = scale(x),
    ys = scale(y);
  const mx = mean(xs),
    my = mean(ys);
  let num = 0,
    dx2 = 0,
    dy2 = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx,
      dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2) * Math.sqrt(dy2);
  if (denom === 0) throw new Error("数值精度不足，无法计算相关系数");
  // Round-off can put a mathematically valid coefficient just outside [-1, 1].
  return Math.max(-1, Math.min(1, num / denom));
}

function correlationT(r: number, df: number): number {
  return Math.abs(r) === 1 ? Math.sign(r) * Infinity : r * Math.sqrt(df / (1 - r * r));
}

/** Exact two-sided pairing-permutation test, bounded to n <= 9 (9! permutations).
 * Doubled centered midranks are integers, so extremeness comparisons need no float tolerance.
 * Repeated ranks are deliberately counted with their permutation multiplicity.
 */
function exactSpearmanP(rx: number[], ry: number[]): number {
  const n = rx.length;
  const x = rx.map((v) => 2 * v - (n + 1));
  const y = ry.map((v) => 2 * v - (n + 1));
  const observed = Math.abs(x.reduce((sum, v, i) => sum + v * y[i], 0));
  let extreme = 0,
    total = 0;
  const permute = (index: number, sum: number) => {
    if (index === n) {
      total++;
      if (Math.abs(sum) >= observed) extreme++;
      return;
    }
    for (let j = index; j < n; j++) {
      [y[index], y[j]] = [y[j], y[index]];
      permute(index + 1, sum + x[index] * y[index]);
      [y[index], y[j]] = [y[j], y[index]];
    }
  };
  permute(0, 0);
  return extreme / total;
}

export function runPearson(
  x: number[],
  y: number[]
): { stats: Record<string, number>; apa: APAReport } {
  validatePairs(x, y);
  const n = x.length;
  const r = correlation(x, y);
  const df = n - 2;
  const t = correlationT(r, df);
  const p = Math.abs(r) === 1 ? 0 : 2 * (1 - tDistCDF(Math.abs(t), df));
  const rSq = r * r;
  const ci = n > 3 && Math.abs(r) === 1 ? [r, r] : pearsonCI(r, n);
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
  const stats: Record<string, number> = {
    r: +r.toFixed(4),
    r_squared: +rSq.toFixed(4),
    // At perfect correlation t diverges; omit it rather than serializing Infinity as null.
    ...(Number.isFinite(t) ? { t: +t.toFixed(4) } : {}),
    df: n - 2,
    p: +p.toFixed(6),
    CI_95_low: ci[0],
    CI_95_high: ci[1],
    n,
  };
  const apa = formatAPA({
    title: "Pearson 相关分析",
    test: "Pearson's r",
    statistic: `r(${n - 2}) = ${r.toFixed(3)}`,
    df: `${n - 2}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `R² = ${rSq.toFixed(2)}（解释 ${(rSq * 100).toFixed(1)}% 方差）`,
    ci: `95% CI [${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]`,
    conclusion:
      p < 0.05
        ? `两变量间存在显著的${r > 0 ? "正" : "负"}相关（${strength}，${pStars(p)}）。`
        : "两变量间无显著线性相关。",
    interpretation: `Pearson 相关分析结果表明，两变量间${p < 0.05 ? "存在显著的" : "不存在显著的"}${
      r > 0 ? "正" : "负"
    }线性相关，r(${n - 2}) = ${r.toFixed(3)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，95% CI [${ci[0].toFixed(
      3
    )}, ${ci[1].toFixed(3)}]。R² = ${rSq.toFixed(2)}，表明一个变量可解释另一个变量 ${(rSq * 100).toFixed(1)}% 的变异。`,
  });
  return { stats, apa };
}

export function runSpearman(
  x: number[],
  y: number[]
): { stats: Record<string, number>; apa: APAReport } {
  validatePairs(x, y);
  const n = x.length;
  const rx = rank(x),
    ry = rank(y);
  const rho = correlation(rx, ry);
  const t = correlationT(rho, n - 2);
  const exact = n <= 9;
  const p = exact
    ? exactSpearmanP(rx, ry)
    : Math.abs(rho) === 1
      ? 0
      : 2 * (1 - tDistCDF(Math.abs(t), n - 2));
  const method = exact ? "双侧精确配对置换检验" : "双侧 Student t 渐近近似";
  const stats: Record<string, number> = {
    rho: +rho.toFixed(4),
    // The exact test uses rho directly, not a Student t statistic.
    ...(!exact ? { df: n - 2, ...(Number.isFinite(t) ? { t: +t.toFixed(4) } : {}) } : {}),
    p: +p.toFixed(6),
    n,
  };
  const apa = formatAPA({
    title: "Spearman 秩相关",
    test: `Spearman's ρ（${method}）`,
    statistic: `ρ = ${rho.toFixed(3)}`,
    ...(!exact ? { df: `${n - 2}` } : {}),
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    conclusion:
      p < 0.05 ? `两变量间存在显著的${rho > 0 ? "正" : "负"}秩相关。` : "两变量间无显著秩相关。",
    interpretation: `Spearman 秩相关分析（N = ${n}）结果显示 ρ = ${rho.toFixed(3)}，p ${
      p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
    }（${method}）${exact ? "。" : "；小样本或大量并列秩时近似可能不准确，建议置换检验。"}`,
  });
  return { stats, apa };
}
