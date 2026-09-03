import { normalCDF, rank, chiDistCDF, pStars } from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

export function runMannWhitney(
  g1: number[],
  g2: number[]
): { stats: Record<string, number>; apa: APAReport } {
  const n1 = g1.length,
    n2 = g2.length;
  const combined = [...g1.map((v) => ({ v, g: 1 })), ...g2.map((v) => ({ v, g: 2 }))];
  combined.sort((a, b) => a.v - b.v);
  const ranks = combined.map((_, i) => i + 1);
  // Handle ties
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length && combined[j].v === combined[i].v) j++;
    const avgRank = (i + j + 1) / 2;
    for (let k = i; k < j; k++) ranks[k] = avgRank;
    i = j;
  }
  let R1 = 0;
  for (let k = 0; k < combined.length; k++) {
    if (combined[k].g === 1) R1 += ranks[k];
  }
  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);
  const muU = (n1 * n2) / 2;
  const sigmaU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = sigmaU > 0 ? (U - muU) / sigmaU : 0;
  const p = 2 * (1 - normalCDF(Math.abs(z)));
  const r = Math.sqrt(n1 + n2) > 0 ? Math.abs(z) / Math.sqrt(n1 + n2) : 0;
  const stats = {
    U: +U.toFixed(2),
    U1: +U1.toFixed(2),
    U2: +U2.toFixed(2),
    z: +z.toFixed(4),
    p: +p.toFixed(6),
    r_effect: +r.toFixed(4),
  };
  const apa = formatAPA({
    title: "Mann-Whitney U 检验",
    test: "Mann-Whitney U",
    statistic: `U = ${U.toFixed(2)}, z = ${z.toFixed(2)}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `r = ${r.toFixed(2)}`,
    conclusion: p < 0.05 ? "两组秩分布存在显著差异。" : "两组秩分布无显著差异。",
    interpretation: `Mann-Whitney U 检验（N₁ = ${n1}, N₂ = ${n2}）显示两组差异${p < 0.05 ? "显著" : "不显著"}，U = ${U.toFixed(
      2
    )}，z = ${z.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，效应量 r = ${r.toFixed(2)}。`,
  });
  return { stats, apa };
}

export function runWilcoxon(pairs: [number, number][]): {
  stats: Record<string, number>;
  apa: APAReport;
} {
  const diffs = pairs.map(([a, b]) => a - b).filter((d) => d !== 0);
  const absDiffs = diffs.map(Math.abs);
  const r = rank(absDiffs);
  const signedRanks = diffs.map((d, i) => (d > 0 ? r[i] : -r[i]));
  const Wpos = signedRanks.filter((item) => item > 0).reduce((s, item) => s + item, 0);
  const Wneg = Math.abs(signedRanks.filter((item) => item < 0).reduce((s, item) => s + item, 0));
  const W = Math.min(Wpos, Wneg);
  const n = diffs.length;
  const muW = (n * (n + 1)) / 4;
  const sigmaW = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const z = n > 20 && sigmaW > 0 ? (W - muW) / sigmaW : 0;
  const p = n > 20 ? 2 * (1 - normalCDF(Math.abs(z))) : 0.5;
  const rEff = n > 20 ? Math.abs(z) / Math.sqrt(n * 2) : 0;
  const stats = {
    W: +W.toFixed(2),
    W_pos: +Wpos.toFixed(2),
    W_neg: +Wneg.toFixed(2),
    n_pairs: n,
    z: +z.toFixed(4),
    p: +p.toFixed(6),
    r_effect: +rEff.toFixed(4),
  };
  const apa = formatAPA({
    title: "Wilcoxon 符号秩检验",
    test: "Wilcoxon Signed-Rank",
    statistic: `W = ${W.toFixed(2)}${n > 20 ? `, z = ${z.toFixed(2)}` : ""}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `r = ${rEff.toFixed(2)}`,
    conclusion: p < 0.05 ? "配对样本差异显著。" : "配对样本无显著差异。",
    interpretation: `Wilcoxon 符号秩检验（n = ${n} 对）结果 W = ${W.toFixed(2)}，p ${
      p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
    }。`,
  });
  return { stats, apa };
}

export function runKruskalWallis(groups: number[][]): {
  stats: Record<string, number>;
  apa: APAReport;
} {
  const k = groups.length;
  const all = groups.flat();
  const N = all.length;
  const allRanks = rank(all);
  let idx = 0;
  const groupRanks: number[][] = groups.map((g) => {
    const r = allRanks.slice(idx, idx + g.length);
    idx += g.length;
    return r;
  });
  let H = 0;
  for (let i = 0; i < k; i++) {
    const Ri = groupRanks[i].reduce((s, r) => s + r, 0);
    H += Ri ** 2 / Math.max(1, groups[i].length);
  }
  H = (12 / (N * (N + 1) || 1)) * H - 3 * (N + 1);
  const p = 1 - chiDistCDF(Math.max(0, H), Math.max(1, k - 1));
  const epsilonSq = Math.max(0, H / Math.max(1, N - 1));
  const stats = {
    H: +H.toFixed(4),
    df: k - 1,
    p: +p.toFixed(6),
    epsilon_squared: +epsilonSq.toFixed(4),
  };
  const apa = formatAPA({
    title: "Kruskal-Wallis 检验",
    test: "Kruskal-Wallis H",
    statistic: `H(${k - 1}) = ${H.toFixed(2)}`,
    df: `${k - 1}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `ε² = ${epsilonSq.toFixed(2)}`,
    conclusion: p < 0.05 ? "各组秩分布存在显著差异。" : "各组秩分布无显著差异。",
    interpretation: `Kruskal-Wallis 检验（k = ${k}, N = ${N}）结果显示各组差异${p < 0.05 ? "显著" : "不显著"}，H(${
      k - 1
    }) = ${H.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。`,
  });
  return { stats, apa };
}

export function runFriedman(
  matrix: number[][],
  labels: string[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const n = matrix.length;
  const k = labels.length;
  const rankSums = Array(k).fill(0) as number[];
  for (const row of matrix) {
    const ranks = rank(row);
    for (let j = 0; j < k; j++) rankSums[j] += ranks[j];
  }
  const qStat =
    (12 / (n * k * (k + 1) || 1)) * rankSums.reduce((s, r) => s + r ** 2, 0) - 3 * n * (k + 1);
  const df = Math.max(1, k - 1);
  const p = 1 - chiDistCDF(Math.max(0, qStat), df);
  const kendallW = qStat / (n * df || 1);
  return {
    stats: {
      n_subjects: n,
      conditions: k,
      chi_square: +qStat.toFixed(4),
      df,
      p: +p.toFixed(6),
      kendalls_w: +kendallW.toFixed(4),
      rank_sums: rankSums.map((r, i) => `${labels[i]}=${r.toFixed(2)}`).join("; "),
    },
    apa: formatAPA({
      title: "Friedman 检验",
      test: "Friedman Test",
      statistic: `χ²(${df}) = ${qStat.toFixed(2)}`,
      df: `${df}`,
      p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
      effect: `Kendall's W = ${kendallW.toFixed(2)}`,
      conclusion:
        p < 0.05 ? "多个配对条件的秩分布存在显著差异。" : "多个配对条件的秩分布无显著差异。",
      interpretation: `Friedman 检验基于 ${n} 个完整观测和 ${k} 个条件，χ²(${df}) = ${qStat.toFixed(2)}，p ${
        p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
      }，Kendall's W = ${kendallW.toFixed(2)}。`,
    }),
  };
}

export function runChiSquare(table: number[][]): { stats: Record<string, number>; apa: APAReport } {
  const rows = table.length,
    cols = table[0].length;
  const rowTotals = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colTotals = table[0].map((_, j) => table.reduce((s, r) => s + r[j], 0));
  const grand = rowTotals.reduce((a, b) => a + b, 0);
  let chi2 = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const e = (rowTotals[i] * colTotals[j]) / (grand || 1);
      if (e > 0) {
        chi2 += (table[i][j] - e) ** 2 / e;
      }
    }
  }
  const df = Math.max(1, (rows - 1) * (cols - 1));
  const p = 1 - chiDistCDF(chi2, df);
  const minDim = Math.max(1, Math.min(rows - 1, cols - 1));
  const cramersV = Math.sqrt(chi2 / (grand * minDim || 1));
  const vInterp = cramersV < 0.1 ? "微小" : cramersV < 0.3 ? "小" : cramersV < 0.5 ? "中" : "大";
  const stats = {
    chi_square: +chi2.toFixed(4),
    df,
    p: +p.toFixed(6),
    cramers_v: +cramersV.toFixed(4),
    N: grand,
  };
  const apa = formatAPA({
    title: "卡方检验",
    test: "Pearson Chi-Square",
    statistic: `χ²(${df}) = ${chi2.toFixed(2)}`,
    df: `${df}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `V = ${cramersV.toFixed(2)} (${vInterp}效应量)`,
    conclusion: p < 0.05 ? `两变量间存在显著关联（${pStars(p)}）。` : "两变量间无显著关联。",
    interpretation: `卡方检验（N = ${grand}）结果显示变量间${p < 0.05 ? "存在显著关联" : "无显著关联"}，χ²(${df}) = ${chi2.toFixed(
      2
    )}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，Cramér's V = ${cramersV.toFixed(2)}。`,
  });
  return { stats, apa };
}

export function runFisherExact(table: number[][]): {
  stats: Record<string, number>;
  apa: APAReport;
} {
  const a = table[0][0],
    b = table[0][1],
    c = table[1][0],
    d = table[1][1];
  const n = a + b + c + d;
  const row1 = a + b,
    col1 = a + c,
    col2 = b + d;

  const logC = (N: number, K: number): number => {
    if (K < 0 || K > N) return -Infinity;
    let s = 0;
    for (let i = 0; i < K; i++) s += Math.log(N - i) - Math.log(i + 1);
    return s;
  };

  const hypergeom = (k: number): number => {
    if (k < Math.max(0, row1 + col1 - n) || k > Math.min(row1, col1)) return 0;
    const logP = logC(col1, k) + logC(col2, row1 - k) - logC(n, row1);
    return Math.exp(logP);
  };

  const pObserved = hypergeom(a);
  let p = pObserved;
  for (let k = Math.max(0, row1 + col1 - n); k <= Math.min(row1, col1); k++) {
    const pk = hypergeom(k);
    if (pk <= pObserved + 1e-10 && k !== a) p += pk;
  }
  p = Math.min(p, 1);
  const stats = { a, b, c, d, n, p_exact: +p.toFixed(6) };
  const apa = formatAPA({
    title: "Fisher 精确检验",
    test: "Fisher's Exact (two-sided)",
    p: `= ${p.toFixed(4)}`,
    conclusion: p < 0.05 ? "两变量间存在显著关联。" : "两变量间无显著关联。",
    interpretation: `Fisher 精确检验（2×2 表，双侧）p = ${p.toFixed(4)}。`,
  });
  return { stats, apa };
}
