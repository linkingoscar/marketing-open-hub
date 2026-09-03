/**
 * 统计与数学计算基础库
 * 包含描述性统计、经典概率分布 CDF、数值分析与线性代数工具
 */

export function mean(a: number[]): number {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}

export function median(a: number[]): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function variance(a: number[]): number {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
}

export function stddev(a: number[]): number {
  return Math.sqrt(variance(a));
}

export function se(a: number[]): number {
  return a.length ? stddev(a) / Math.sqrt(a.length) : 0;
}

export function skewness(a: number[]): number {
  const m = mean(a),
    s = stddev(a),
    n = a.length;
  if (n < 3 || s === 0) return 0;
  return (n / ((n - 1) * (n - 2))) * a.reduce((sum, x) => sum + ((x - m) / s) ** 3, 0);
}

export function kurtosis(a: number[]): number {
  const m = mean(a),
    s = stddev(a),
    n = a.length;
  if (n < 4 || s === 0) return 0;
  return (
    ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) *
      a.reduce((sum, x) => sum + ((x - m) / s) ** 4, 0) -
    (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
  );
}

export function q(a: number[], p: number): number {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const idx = Math.min(s.length - 1, Math.max(0, Math.floor(s.length * p)));
  return s[idx];
}

export function normalCDF(x: number): number {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const s = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * absX);
  return (
    0.5 *
    (1 + s * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)))
  );
}

export function gammaFn(z: number): number {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
  z -= 1;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7.5;
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}

export function logGamma(z: number): number {
  if (z <= 0) return 0;
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  const zm1 = z - 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (zm1 + i);
  const t = zm1 + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (zm1 + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * 正则化下不完全伽马函数 P(a, x) = gamma(a, x) / Gamma(a)
 * x < a + 1 时采用级数展开；x >= a + 1 时采用勒让德连分数展开
 */
export function regIncGamma(a: number, x: number): number {
  if (x <= 0 || a <= 0) return 0;

  if (x < a + 1.0) {
    let sum = 1.0 / a;
    let del = sum;
    for (let n = 1; n <= 100; n++) {
      del *= x / (a + n);
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    const result = sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
    return Math.min(1, Math.max(0, result));
  } else {
    const ITMAX = 100;
    const EPS = 1e-14;
    const FPMIN = 1e-30;
    let b = x + 1.0 - a;
    let c = 1.0 / FPMIN;
    let d = 1.0 / b;
    let h = d;
    for (let i = 1; i <= ITMAX; i++) {
      const an = -i * (i - a);
      b += 2.0;
      d = an * d + b;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1.0 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1.0) <= EPS) break;
    }
    const qVal = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
    return Math.min(1, Math.max(0, 1.0 - qVal));
  }
}

export function regIncBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let s = 0;
  const dt = x / 300;
  for (let i = 0; i < 300; i++) {
    const t = (i + 0.5) * dt;
    s += t ** (a - 1) * (1 - t) ** (b - 1) * dt;
  }
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const denom = Math.exp(logBeta);
  return Math.min(1, Math.max(0, s / (denom || 1e-12)));
}

export function tDistCDF(t: number, df: number): number {
  if (df <= 0) return 0;
  if (t === 0) return 0.5;
  const x = df / (df + t * t);
  const ib = regIncBeta(x, df / 2, 0.5);
  return t > 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

/**
 * Student's t 分布分位数函数（Quantile / Inverse CDF）
 * 用于计算置信区间临界值 t_crit（如 95% CI 双尾对应的 tDistQuantile(0.975, df)）
 */
export function tDistQuantile(p: number, df: number): number {
  if (df <= 0) return 0;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;
  if (p < 0.5) return -tDistQuantile(1 - p, df);

  // 对于 p > 0.5，寻找 t > 0 使得 tDistCDF(t, df) = p
  let low = 0;
  let high = 5;
  while (tDistCDF(high, df) < p && high < 1e6) {
    low = high;
    high *= 2;
  }

  // 45 次二分搜索，精度优于 1e-9
  for (let i = 0; i < 45; i++) {
    const mid = (low + high) / 2;
    if (tDistCDF(mid, df) < p) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

export function fDistCDF(f: number, d1: number, d2: number): number {
  if (f <= 0 || d1 <= 0 || d2 <= 0) return 0;
  return regIncBeta((d1 * f) / (d1 * f + d2), d1 / 2, d2 / 2);
}

export function chiDistCDF(x: number, k: number): number {
  if (x <= 0 || k <= 0) return 0;
  return regIncGamma(k / 2, x / 2);
}

export function pStars(p: number): string {
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "n.s.";
}

export function rank(arr: number[]): number[] {
  const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j < sorted.length && sorted[j].v === sorted[i].v) j++;
    const avgRank = (i + j + 1) / 2;
    for (let k = i; k < j; k++) ranks[sorted[k].i] = avgRank;
    i = j;
  }
  return ranks;
}

export function pearsonCI(r: number, n: number, alpha = 0.05): [number, number] {
  if (n <= 3) return [-1, 1];
  const clampedR = Math.max(-0.9999, Math.min(0.9999, r));
  const z = 0.5 * Math.log((1 + clampedR) / (1 - clampedR));
  const se = 1 / Math.sqrt(n - 3);
  const zCrit = alpha === 0.05 ? 1.96 : 2.576;
  const lo = z - zCrit * se,
    hi = z + zCrit * se;
  return [+Math.tanh(lo).toFixed(4), +Math.tanh(hi).toFixed(4)];
}

/**
 * 平滑连续的正态检验 p 值近似（基于对数变换特征量）
 * 替代原先硬编码的离散 4 阶梯阈值
 */
export function approximateNormalityP(wStat: number, n: number): number {
  if (wStat >= 0.99) return 0.75;
  if (wStat <= 0.5) return 0.0001;
  // Royston (1992) 式 log(1-W) 平滑映射近似
  const y = Math.log(Math.max(1e-6, 1 - wStat));
  const mu = -1.2725 - 1.0521 * (Math.log(n) - 2.5);
  const sigma = 1.0308 - 0.267 * (Math.log(n) - 2.5);
  const z = (y - mu) / Math.max(0.1, sigma);
  const p = 1 - normalCDF(z);
  return Math.max(0.0001, Math.min(0.9999, +p.toFixed(4)));
}

export function matVecMul(m: number[][], v: number[]): number[] {
  return m.map((r) => r.reduce((s, val, i) => s + val * v[i], 0));
}

export function matMul(a: number[][], b: number[][]): number[][] {
  const rA = a.length,
    cA = a[0].length,
    cB = b[0].length;
  const out: number[][] = Array.from({ length: rA }, () => new Array(cB).fill(0));
  for (let i = 0; i < rA; i++) {
    for (let k = 0; k < cA; k++) {
      for (let j = 0; j < cB; j++) {
        out[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return out;
}

export function matInv(m: number[][]): number[][] {
  const n = m.length;
  const aug = m.map((r, i) => [
    ...r,
    ...Array(n)
      .fill(0)
      .map((_, j) => (i === j ? 1 : 0)),
  ]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const f = aug[k][i];
        for (let j = 0; j < 2 * n; j++) aug[k][j] -= f * aug[i][j];
      }
    }
  }
  return aug.map((r) => r.slice(n));
}

export function transpose(m: number[][]): number[][] {
  if (!m.length || !m[0].length) return [];
  return m[0].map((_, j) => m.map((r) => r[j]));
}

export function determinant(matrix: number[][]): number {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);
  let det = 1;
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
    }
    if (Math.abs(a[pivot][i]) < 1e-12) return 0;
    if (pivot !== i) {
      [a[i], a[pivot]] = [a[pivot], a[i]];
      det *= -1;
    }
    det *= a[i][i];
    for (let r = i + 1; r < n; r++) {
      const factor = a[r][i] / a[i][i];
      for (let c = i; c < n; c++) a[r][c] -= factor * a[i][c];
    }
  }
  return det;
}

export function addRidge(matrix: number[][], ridge = 1e-6): number[][] {
  return matrix.map((row, i) => row.map((v, j) => v + (i === j ? ridge : 0)));
}

export function fitLinearModel(x: number[][], y: number[]) {
  const X = x.map((row) => [1, ...row]);
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const XtXinv = matInv(XtX.map((row, i) => row.map((v, j) => v + (i === j ? 1e-8 : 0))));
  const Xty = matVecMul(Xt, y);
  const beta = matVecMul(XtXinv, Xty);
  const yHat = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
  const residuals = y.map((yi, i) => yi - yHat[i]);
  const sse = residuals.reduce((s, r) => s + r ** 2, 0);
  const yMean = mean(y);
  const sst = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  return {
    beta,
    yHat,
    residuals,
    sse,
    dfResidual: Math.max(1, y.length - beta.length),
    rSquared: sst > 0 ? Math.max(0, 1 - sse / sst) : 0,
  };
}
