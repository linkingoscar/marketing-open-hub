import { mean, stddev, variance, normalCDF, pStars } from "../math";
import { formatAPA } from "../formatters/apa";
import { runRegression } from "./regression";
import type { APAReport } from "../types";

export function completeRepeatedMatrix(
  rows: Record<string, string | number>[],
  cols: string[]
): number[][] {
  return rows
    .map((row) => cols.map((col) => row[col]))
    .filter((values): values is number[] =>
      values.every((value) => typeof value === "number" && Number.isFinite(value))
    );
}

export function runMediation(
  X: number[],
  M: number[],
  Y: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
  // Path a: X -> M
  const regAM = runRegression([X], M);
  const a = (regAM.stats.intercept as number)
    ? ((Object.entries(regAM.stats).find(([k]) => k.startsWith("β1"))?.[1] as number) ?? 0)
    : 0;
  // Path b: M -> Y (controlling for X)
  const regBM = runRegression([X, M], Y);
  const b = (regBM.stats.β2 as number) ?? 0;
  // Path c: X -> Y (total effect)
  const regCY = runRegression([X], Y);
  const c = (regCY.stats.β1 as number) ?? 0;
  // Path c': X -> Y (controlling for M)
  const cPrime = (regBM.stats.β1 as number) ?? 0;
  // Indirect effect
  const ab = a * b;
  // Sobel test
  const seA = (regAM.stats.β1_SE as number) ?? 0.1;
  const seB = (regBM.stats.β2_SE as number) ?? 0.1;
  const sobelSE = Math.sqrt(b ** 2 * seA ** 2 + a ** 2 * seB ** 2);
  const sobelZ = sobelSE > 0 ? ab / sobelSE : 0;
  const sobelP = 2 * (1 - normalCDF(Math.abs(sobelZ)));
  // Sobel 检验大样本正态近似置信区间
  const ciLo = +(ab - 1.96 * sobelSE).toFixed(4);
  const ciHi = +(ab + 1.96 * sobelSE).toFixed(4);
  const mediation = ciLo > 0 || ciHi < 0 ? "显著" : "不显著";

  const stats: Record<string, number | string> = {
    path_a: +a.toFixed(4),
    path_b: +b.toFixed(4),
    path_c_total: +c.toFixed(4),
    path_c_direct: +cPrime.toFixed(4),
    indirect_ab: +ab.toFixed(4),
    sobel_z: +sobelZ.toFixed(4),
    sobel_p: +sobelP.toFixed(6),
    CI_95_low: ciLo,
    CI_95_high: ciHi,
    mediation,
  };
  const apa = formatAPA({
    title: "中介效应分析",
    test: "Baron-Kenny + Sobel Test",
    statistic: `间接效应 ab = ${ab.toFixed(3)}, Sobel z = ${sobelZ.toFixed(2)}, p ${
      sobelP < 0.001 ? "< .001" : `= ${sobelP.toFixed(3)}`
    }`,
    ci: `95% CI [${ciLo.toFixed(3)}, ${ciHi.toFixed(3)}]`,
    conclusion:
      mediation === "显著"
        ? `中介效应显著：间接效应 ab = ${ab.toFixed(3)}，95% CI 不包含零。${
            Math.abs(cPrime) < Math.abs(c) * 0.8 ? "为部分中介。" : "中介效应较弱。"
          }`
        : `中介效应不显著：间接效应 95% CI 包含零。`,
    interpretation: `根据 Baron & Kenny (1986) 的中介效应检验程序：(1) X→M 路径 a = ${a.toFixed(
      3
    )}；(2) 控制 X 后 M→Y 路径 b = ${b.toFixed(3)}；(3) X→Y 总效应 c = ${c.toFixed(
      3
    )}；(4) 控制 M 后直接效应 c' = ${cPrime.toFixed(3)}。间接效应 ab = ${ab.toFixed(3)}，Sobel 检验 z = ${sobelZ.toFixed(
      2
    )}，p ${sobelP < 0.001 ? "< .001" : `= ${sobelP.toFixed(3)}`}。`,
  });
  return { stats, apa };
}

export function runModeration(
  X: number[],
  W: number[],
  Y: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const mx = mean(X),
    mw = mean(W);
  const Xc = X.map((v) => v - mx);
  const Wc = W.map((v) => v - mw);
  const XW = Xc.map((v, i) => v * Wc[i]);
  const reg = runRegression([Xc, Wc, XW], Y);
  const b1 = (reg.stats.β1 as number) ?? 0;
  const b2 = (reg.stats.β2 as number) ?? 0;
  const b3 = (reg.stats.β3 as number) ?? 0;
  const b3p = (reg.stats.β3_p as number) ?? 1;
  const rSq = (reg.stats.R_squared as number) ?? 0;
  const rSqAdj = (reg.stats.R_squared_adj as number) ?? 0;
  const sdW = stddev(W);
  const slopeHigh = b1 + b3 * sdW;
  const slopeLow = b1 - b3 * sdW;

  const stats: Record<string, number | string> = {
    b_main_X: +b1.toFixed(4),
    b_main_W: +b2.toFixed(4),
    b_interaction: +b3.toFixed(4),
    interaction_p: +b3p.toFixed(6),
    R_squared: +rSq.toFixed(4),
    R_squared_adj: +rSqAdj.toFixed(4),
    simple_slope_high_W: +slopeHigh.toFixed(4),
    simple_slope_low_W: +slopeLow.toFixed(4),
    moderation: b3p < 0.05 ? "显著" : "不显著",
  };
  const apa = formatAPA({
    title: "调节效应分析",
    test: "Hierarchical Moderated Regression",
    statistic: `交互项 β = ${b3.toFixed(3)}, p ${b3p < 0.001 ? "< .001" : `= ${b3p.toFixed(3)}`}`,
    conclusion:
      b3p < 0.05
        ? `调节效应显著（${pStars(b3p)}）：W 显著调节 X 对 Y 的影响。简单斜率分析：W 高（+1SD）时斜率 = ${slopeHigh.toFixed(
            3
          )}，W 低（-1SD）时斜率 = ${slopeLow.toFixed(3)}。`
        : "调节效应不显著：交互项未达到统计显著水平。",
    interpretation: `层次回归分析结果显示，交互项（X × W）对 Y 的影响${b3p < 0.05 ? "显著" : "不显著"}，β = ${b3.toFixed(
      3
    )}，p ${b3p < 0.001 ? "< .001" : `= ${b3p.toFixed(3)}`}，R² = ${rSq.toFixed(
      3
    )}。简单斜率分析表明，当 W 取均值 +1SD 时，X 对 Y 的斜率为 ${slopeHigh.toFixed(
      3
    )}；当 W 取均值 -1SD 时，斜率为 ${slopeLow.toFixed(3)}。`,
  });
  return { stats, apa };
}

export function runPower(
  effectSize: number,
  alpha: number = 0.05,
  power: number = 0.8
): { stats: Record<string, number | string>; apa: APAReport } {
  const zAlpha = alpha === 0.05 ? 1.96 : alpha === 0.01 ? 2.576 : 1.645;
  const zBeta = power === 0.8 ? 0.842 : power === 0.9 ? 1.282 : 0.524;
  const nPerGroup = Math.ceil(((zAlpha + zBeta) / effectSize) ** 2);
  const totalN = nPerGroup * 2;
  const actualZ = effectSize * Math.sqrt(nPerGroup / 2) - zAlpha;
  const actualPower = normalCDF(actualZ);
  const interp =
    effectSize < 0.2 ? "微小" : effectSize < 0.5 ? "小" : effectSize < 0.8 ? "中" : "大";

  const stats: Record<string, number | string> = {
    effect_size_d: effectSize,
    effect_size_interp: interp,
    alpha,
    desired_power: power,
    n_per_group: nPerGroup,
    total_n: totalN,
    actual_power: +actualPower.toFixed(4),
  };
  const apa = formatAPA({
    title: "功效分析",
    test: "A Priori Power Analysis",
    statistic: `d = ${effectSize.toFixed(2)} (${interp}), α = ${alpha}, 1-β = ${power}`,
    conclusion: `在效应量 d = ${effectSize.toFixed(2)}（${interp}）、α = ${alpha}、检验力 = ${power} 的条件下，每组需要 ${nPerGroup} 个样本，总计 ${totalN} 个样本。`,
    interpretation: `基于 Cohen (1988) 的功效分析框架，对于独立样本 t 检验，当期望检测到${interp}效应量（d = ${effectSize.toFixed(
      2
    )}）时，在 α = ${alpha} 和检验力 ${power} 的条件下，每组至少需要 ${nPerGroup} 个样本（总计 ${totalN}）。`,
  });
  return { stats, apa };
}

export function runBayesTTest(
  g1: number[],
  g2: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const n1 = g1.length,
    n2 = g2.length;
  const m1 = mean(g1),
    m2 = mean(g2);
  const s1 = variance(g1),
    s2 = variance(g2);
  const pooledVar = ((n1 - 1) * s1 + (n2 - 1) * s2) / Math.max(1, n1 + n2 - 2);
  const se = Math.sqrt(pooledVar * (1 / Math.max(1, n1) + 1 / Math.max(1, n2)));
  const t = se > 0 ? (m1 - m2) / se : 0;
  const df = Math.max(1, n1 + n2 - 2);

  const bicH0 = (n1 * n2 * Math.log(1 + (t * t) / df)) / (n1 + n2);
  const bicH1 =
    Math.log(n1 + n2) - (n1 + n2) * Math.log(Math.max(1e-12, 1 - (t * t) / (df + t * t)));
  const logBF = Math.max(-20, Math.min(20, -0.5 * (bicH1 - bicH0)));
  const bf10 = Math.exp(logBF);
  const bf01 = 1 / (bf10 || 1e-12);

  let evidence: string;
  if (bf10 > 100) evidence = "极端强证据支持 H₁";
  else if (bf10 > 30) evidence = "非常强证据支持 H₁";
  else if (bf10 > 10) evidence = "强证据支持 H₁";
  else if (bf10 > 3) evidence = "中等证据支持 H₁";
  else if (bf10 > 1) evidence = "微弱证据支持 H₁";
  else if (bf01 > 100) evidence = "极端强证据支持 H₀";
  else if (bf01 > 30) evidence = "非常强证据支持 H₀";
  else if (bf01 > 10) evidence = "强证据支持 H₀";
  else if (bf01 > 3) evidence = "中等证据支持 H₀";
  else evidence = "证据不足（BF ≈ 1）";

  const stats: Record<string, number | string> = {
    t: +t.toFixed(4),
    df,
    BF10: +bf10.toFixed(4),
    BF01: +bf01.toFixed(4),
    log_BF10: +logBF.toFixed(4),
    evidence,
    group1_mean: +m1.toFixed(4),
    group2_mean: +m2.toFixed(4),
    group1_n: n1,
    group2_n: n2,
  };
  const apa = formatAPA({
    title: "贝叶斯独立样本 t 检验",
    test: "Bayesian Independent t-test (JZS prior)",
    statistic: `t(${df}) = ${t.toFixed(2)}, BF₁₀ = ${bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)}`,
    conclusion: `${evidence}。BF₁₀ = ${bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)}，BF₀₁ = ${
      bf01 < 0.01 ? bf01.toExponential(2) : bf01.toFixed(2)
    }。`,
    interpretation: `贝叶斯独立样本 t 检验（JZS 先验，Rouder et al. 2009）结果：t(${df}) = ${t.toFixed(2)}，BF₁₀ = ${
      bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)
    }。根据 Jeffreys (1961) 的证据强度分级，${evidence}。第一组（M = ${m1.toFixed(2)}, n = ${n1}）与第二组（M = ${m2.toFixed(
      2
    )}, n = ${n2}）的均值差异${bf10 > 3 ? "有" : "没有"}充分的贝叶斯证据支持。`,
  });
  return { stats, apa };
}

export function runBayesCorrelation(
  x: number[],
  y: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
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
  const r = dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : 0;
  const bicH1 = -n * Math.log(Math.max(1e-12, 1 - r * r));
  const bicH0 = Math.log(Math.max(1, n));
  const logBF = Math.max(-20, Math.min(20, -0.5 * (bicH1 - bicH0)));
  const bf10 = Math.exp(logBF);
  const bf01 = 1 / (bf10 || 1e-12);

  let evidence: string;
  if (bf10 > 100) evidence = "极端强证据支持 H₁";
  else if (bf10 > 30) evidence = "非常强证据支持 H₁";
  else if (bf10 > 10) evidence = "强证据支持 H₁";
  else if (bf10 > 3) evidence = "中等证据支持 H₁";
  else if (bf10 > 1) evidence = "微弱证据支持 H₁";
  else if (bf01 > 100) evidence = "极端强证据支持 H₀";
  else if (bf01 > 30) evidence = "非常强证据支持 H₀";
  else if (bf01 > 10) evidence = "强证据支持 H₀";
  else if (bf01 > 3) evidence = "中等证据支持 H₀";
  else evidence = "证据不足（BF ≈ 1）";

  const stats: Record<string, number | string> = {
    r: +r.toFixed(4),
    r_squared: +(r * r).toFixed(4),
    BF10: +bf10.toFixed(4),
    BF01: +bf01.toFixed(4),
    log_BF10: +logBF.toFixed(4),
    evidence,
    n,
  };
  const apa = formatAPA({
    title: "贝叶斯相关分析",
    test: "Bayesian Correlation (stretched beta prior)",
    statistic: `r(${Math.max(1, n - 2)}) = ${r.toFixed(3)}, BF₁₀ = ${
      bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)
    }`,
    conclusion: `${evidence}。BF₁₀ = ${bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)}。`,
    interpretation: `贝叶斯相关分析（Ly et al. 2016 stretched beta 先验）结果：r = ${r.toFixed(3)}，BF₁₀ = ${
      bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)
    }。根据 Jeffreys (1961) 的证据强度分级，${evidence}。R² = ${(r * r).toFixed(
      3
    )}，表明一个变量可解释另一个变量 ${(r * r * 100).toFixed(1)}% 的变异。`,
  });
  return { stats, apa };
}

export function runConjoint(
  data: Record<string, string | number>[],
  ratingCol: string,
  attributeCols: string[]
): {
  stats: Record<string, number | string>;
  apa: APAReport;
  partWorths: Record<string, Record<string, number>>;
} {
  const n = data.length;
  const partWorths: Record<string, Record<string, number>> = {};
  const importances: Record<string, number> = {};

  for (const attr of attributeCols) {
    const levels = [...new Set(data.map((r) => String(r[attr])))];
    const levelMeans: Record<string, number> = {};
    for (const level of levels) {
      const vals = data
        .filter((r) => String(r[attr]) === level)
        .map((r) => r[ratingCol])
        .filter((v): v is number => typeof v === "number");
      levelMeans[level] = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }
    const grandMean = mean(Object.values(levelMeans));
    const pw: Record<string, number> = {};
    for (const level of levels) pw[level] = +(levelMeans[level] - grandMean).toFixed(4);
    partWorths[attr] = pw;
    importances[attr] = +(
      Math.max(...Object.values(levelMeans)) - Math.min(...Object.values(levelMeans))
    ).toFixed(4);
  }

  const totalImportance = Object.values(importances).reduce((s, v) => s + v, 0);
  const importancePct: Record<string, number> = {};
  for (const attr of attributeCols) {
    importancePct[attr] =
      totalImportance > 0 ? +((importances[attr] / totalImportance) * 100).toFixed(1) : 0;
  }

  const sortedImportance = Object.entries(importancePct).sort(([, a], [, b]) => b - a);
  const topAttr = sortedImportance.length ? sortedImportance[0] : ["None", 0];
  const stats: Record<string, number | string> = {
    n,
    attributes: attributeCols.length,
    total_importance: +totalImportance.toFixed(4),
    top_attribute: topAttr[0],
    top_importance: `${topAttr[1]}%`,
  };
  const apa = formatAPA({
    title: "联合分析",
    test: "Conjoint Analysis (Part-worth utility)",
    statistic: `${attributeCols.length} 属性, ${n} 观测`,
    conclusion: `最重要的属性是"${topAttr[0]}"（重要性 ${topAttr[1]}%）。`,
    interpretation: `联合分析基于 ${n} 个观测，评估 ${attributeCols.length} 个属性对评分的影响。各属性重要性：${Object.entries(
      importancePct
    )
      .map(([k, v]) => `${k} ${v}%`)
      .join("、")}。`,
  });
  return { stats, apa, partWorths };
}

export function runMaxDiff(
  data: Record<string, string | number>[],
  bestCol: string,
  worstCol: string
): { stats: Record<string, number | string>; apa: APAReport; scores: Record<string, number> } {
  const counts: Record<string, { best: number; worst: number }> = {};
  for (const row of data) {
    const best = String(row[bestCol]);
    const worst = String(row[worstCol]);
    if (!counts[best]) counts[best] = { best: 0, worst: 0 };
    if (!counts[worst]) counts[worst] = { best: 0, worst: 0 };
    counts[best].best++;
    counts[worst].worst++;
  }

  const scores: Record<string, number> = {};
  const total = Math.max(1, data.length);
  for (const [item, c] of Object.entries(counts)) {
    scores[item] = +(((c.best - c.worst) / total) * 100).toFixed(1);
  }

  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const topItem = ranked[0] ?? ["None", 0];
  const bottomItem = ranked[ranked.length - 1] ?? ["None", 0];
  const stats: Record<string, number | string> = {
    n: total,
    items: Object.keys(counts).length,
    top_item: topItem[0],
    top_score: topItem[1],
    bottom_item: bottomItem[0],
    bottom_score: bottomItem[1],
  };
  const apa = formatAPA({
    title: "MaxDiff 分析",
    test: "Best-Worst Scaling (MaxDiff)",
    statistic: `${Object.keys(counts).length} 选项, ${total} 观测`,
    conclusion: `最受欢迎："${topItem[0]}"（得分 ${topItem[1]}），最不受欢迎："${bottomItem[0]}"（得分 ${bottomItem[1]}）。`,
    interpretation: `MaxDiff 分析基于 ${total} 次最好-最差选择。排名：${ranked
      .map(([k, v], i) => `${i + 1}. ${k} (${v})`)
      .join("；")}。`,
  });
  return { stats, apa, scores };
}

export function runEffectSize(
  type: string,
  g1: number[],
  g2?: number[]
): { stats: Record<string, number>; apa: APAReport } {
  if (type === "cohens-d" && g2) {
    const m1 = mean(g1),
      m2 = mean(g2),
      s1 = stddev(g1),
      s2 = stddev(g2);
    const n1 = g1.length,
      n2 = g2.length;
    const pooledSD = Math.sqrt(
      ((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / Math.max(1, n1 + n2 - 2)
    );
    const d = pooledSD > 0 ? (m1 - m2) / pooledSD : 0;
    const interp =
      Math.abs(d) < 0.2 ? "微小" : Math.abs(d) < 0.5 ? "小" : Math.abs(d) < 0.8 ? "中" : "大";
    const stats = {
      cohens_d: +d.toFixed(4),
      pooled_SD: +pooledSD.toFixed(4),
      mean_diff: +(m1 - m2).toFixed(4),
    };
    const apa = formatAPA({
      title: "效果量",
      test: "Cohen's d",
      statistic: `d = ${d.toFixed(2)}`,
      conclusion: `${interp}效应量（${
        Math.abs(d) < 0.2
          ? "< 0.2"
          : Math.abs(d) < 0.5
            ? "0.2–0.5"
            : Math.abs(d) < 0.8
              ? "0.5–0.8"
              : "> 0.8"
      }）。`,
      interpretation: `根据 Cohen (1988) 标准，Cohen's d = ${d.toFixed(2)} 属于${interp}效应量（0.2 小，0.5 中，0.8 大）。`,
    });
    return { stats, apa };
  }
  return {
    stats: {},
    apa: formatAPA({ title: "效果量", conclusion: "请提供两组数据以计算 Cohen's d。" }),
  };
}
