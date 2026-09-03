import {
  mean,
  stddev,
  normalCDF,
  fDistCDF,
  pStars,
  matMul,
  matInv,
  determinant,
  addRidge,
  fitLinearModel,
} from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

export function runTTest(
  g1: number[],
  g2: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const n1 = g1.length,
    n2 = g2.length;
  const m1 = mean(g1),
    m2 = mean(g2);
  const s1 = stddev(g1),
    s2 = stddev(g2);
  const pooledSE = Math.sqrt(s1 ** 2 / Math.max(1, n1) + s2 ** 2 / Math.max(1, n2));
  const t = pooledSE > 0 ? (m1 - m2) / pooledSE : 0;
  const df = Math.max(1, n1 + n2 - 2);
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  const pooledSD = Math.sqrt(((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / df);
  const cohensD = pooledSD > 0 ? (m1 - m2) / pooledSD : 0;
  const dInterp =
    Math.abs(cohensD) < 0.2
      ? "微小"
      : Math.abs(cohensD) < 0.5
        ? "小"
        : Math.abs(cohensD) < 0.8
          ? "中"
          : "大";
  const ciLo = +(m1 - m2 - 1.96 * pooledSE).toFixed(4);
  const ciHi = +(m1 - m2 + 1.96 * pooledSE).toFixed(4);
  const stats = {
    group1_mean: +m1.toFixed(4),
    group2_mean: +m2.toFixed(4),
    group1_sd: +s1.toFixed(4),
    group2_sd: +s2.toFixed(4),
    group1_n: n1,
    group2_n: n2,
    t: +t.toFixed(4),
    df,
    p: +p.toFixed(6),
    cohens_d: +cohensD.toFixed(4),
    CI_95: `[${ciLo}, ${ciHi}]`,
  };
  const apa = formatAPA({
    title: "独立样本 t 检验",
    test: "Independent Samples t-test",
    statistic: `t(${df}) = ${t.toFixed(2)}`,
    df: `${df}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `d = ${cohensD.toFixed(2)} (${dInterp}效应量)`,
    ci: `95% CI [${ciLo.toFixed(2)}, ${ciHi.toFixed(2)}]`,
    conclusion:
      p < 0.05
        ? `两组均值存在显著差异（${pStars(p)}），${dInterp}效应量。`
        : "两组均值无显著差异。",
    interpretation: `独立样本 t 检验结果表明，两组均值差异${p < 0.05 ? "统计显著" : "不显著"}，t(${df}) = ${t.toFixed(2)}，p ${
      p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
    }，Cohen's d = ${cohensD.toFixed(2)}。${
      p < 0.05
        ? `第一组（M = ${m1.toFixed(2)}, SD = ${s1.toFixed(2)}, n = ${n1}）与第二组（M = ${m2.toFixed(2)}, SD = ${s2.toFixed(2)}, n = ${n2}）之间差异的 95% CI 为 [${ciLo.toFixed(2)}, ${ciHi.toFixed(2)}]。`
        : ""
    }`,
  });
  return { stats, apa };
}

export function runPairedTTest(
  before: number[],
  after: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const n = before.length;
  const diffs = before.map((b, i) => after[i] - b);
  const md = mean(diffs),
    sd = stddev(diffs),
    seVal = sd / Math.sqrt(Math.max(1, n));
  const t = seVal > 0 ? md / seVal : 0;
  const df = Math.max(1, n - 1);
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  const cohensD = sd > 0 ? md / sd : 0;
  const dInterp =
    Math.abs(cohensD) < 0.2
      ? "微小"
      : Math.abs(cohensD) < 0.5
        ? "小"
        : Math.abs(cohensD) < 0.8
          ? "中"
          : "大";
  const ciLo = +(md - 1.96 * seVal).toFixed(4);
  const ciHi = +(md + 1.96 * seVal).toFixed(4);
  const stats: Record<string, number | string> = {
    n_pairs: n,
    mean_before: +mean(before).toFixed(4),
    mean_after: +mean(after).toFixed(4),
    mean_diff: +md.toFixed(4),
    SD_diff: +sd.toFixed(4),
    SE_diff: +seVal.toFixed(4),
    t: +t.toFixed(4),
    df,
    p: +p.toFixed(6),
    cohens_d: +cohensD.toFixed(4),
    CI_95: `[${ciLo}, ${ciHi}]`,
  };
  const apa = formatAPA({
    title: "配对样本 t 检验",
    test: "Paired Samples t-test",
    statistic: `t(${df}) = ${t.toFixed(2)}`,
    df: `${df}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `d = ${cohensD.toFixed(2)} (${dInterp}效应量)`,
    ci: `95% CI [${ciLo.toFixed(2)}, ${ciHi.toFixed(2)}]`,
    conclusion:
      p < 0.05
        ? `前后测差异显著（${pStars(p)}），${md > 0 ? "后测显著高于" : "后测显著低于"}前测。`
        : "前后测差异不显著。",
    interpretation: `配对样本 t 检验（N = ${n} 对）结果表明，前后测差异${p < 0.05 ? "统计显著" : "不显著"}，t(${df}) = ${t.toFixed(2)}，p ${
      p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
    }，Cohen's d = ${cohensD.toFixed(2)}。前测 M = ${mean(before).toFixed(2)}，后测 M = ${mean(after).toFixed(2)}，差值 M = ${md.toFixed(2)}（SD = ${sd.toFixed(2)}）。`,
  });
  return { stats, apa };
}

export function runAnova(groups: number[][]): { stats: Record<string, number>; apa: APAReport } {
  const k = groups.length,
    N = groups.reduce((s, g) => s + g.length, 0);
  const grandMean = mean(groups.flat());
  let ssb = 0,
    ssw = 0;
  for (const g of groups) {
    const gm = mean(g);
    ssb += g.length * (gm - grandMean) ** 2;
    ssw += g.reduce((s, x) => s + (x - gm) ** 2, 0);
  }
  const dfb = Math.max(1, k - 1),
    dfw = Math.max(1, N - k);
  const msb = ssb / dfb,
    msw = ssw / dfw;
  const F = msw > 0 ? msb / msw : 0;
  const p = 1 - fDistCDF(F, dfb, dfw);
  const etaSq = ssb / (ssb + ssw || 1);
  const etaInterp = etaSq < 0.01 ? "微小" : etaSq < 0.06 ? "小" : etaSq < 0.14 ? "中" : "大";
  const omegaSq = (ssb - dfb * msw) / (ssb + ssw + msw || 1);
  const groupMeans = groups.map((g) => ({
    n: g.length,
    M: +mean(g).toFixed(4),
    SD: +stddev(g).toFixed(4),
  }));
  const stats = {
    F: +F.toFixed(4),
    df_between: dfb,
    df_within: dfw,
    p: +p.toFixed(6),
    eta_squared: +etaSq.toFixed(4),
    omega_squared: +omegaSq.toFixed(4),
  };
  const apa = formatAPA({
    title: "单因素方差分析",
    test: "One-Way ANOVA",
    statistic: `F(${dfb}, ${dfw}) = ${F.toFixed(2)}`,
    df: `${dfb}, ${dfw}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `η² = ${etaSq.toFixed(2)} (${etaInterp}效应量), ω² = ${omegaSq.toFixed(2)}`,
    conclusion:
      p < 0.05
        ? `各组均值存在显著差异（${pStars(p)}），${etaInterp}效应量。建议进行事后多重比较（如 Tukey HSD）。`
        : "各组均值无显著差异。",
    interpretation: `单因素方差分析结果表明，各组均值差异${p < 0.05 ? "统计显著" : "不显著"}，F(${dfb}, ${dfw}) = ${F.toFixed(2)}，p ${
      p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
    }，η² = ${etaSq.toFixed(2)}。各组描述性统计：${groupMeans.map((g, i) => `第${i + 1}组（n = ${g.n}, M = ${g.M}, SD = ${g.SD}）`).join("；")}。`,
  });
  return { stats, apa };
}

export function runRepeatedMeasuresAnova(
  matrix: number[][],
  labels: string[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const n = matrix.length;
  const k = labels.length;
  const all = matrix.flat();
  const grandMean = mean(all);
  const conditionMeans = labels.map((_, j) => mean(matrix.map((row) => row[j])));
  const subjectMeans = matrix.map((row) => mean(row));
  const ssTotal = all.reduce((s, v) => s + (v - grandMean) ** 2, 0);
  const ssCondition = n * conditionMeans.reduce((s, m) => s + (m - grandMean) ** 2, 0);
  const ssSubject = k * subjectMeans.reduce((s, m) => s + (m - grandMean) ** 2, 0);
  const ssError = Math.max(0, ssTotal - ssCondition - ssSubject);
  const dfCondition = Math.max(1, k - 1);
  const dfError = Math.max(1, (n - 1) * (k - 1));
  const msCondition = ssCondition / dfCondition;
  const msError = ssError / dfError;
  const F = msError > 0 ? msCondition / msError : 0;
  const p = 1 - fDistCDF(F, dfCondition, dfError);
  const partialEta = ssCondition / (ssCondition + ssError || 1);
  return {
    stats: {
      n_subjects: n,
      levels: k,
      F: +F.toFixed(4),
      df_condition: dfCondition,
      df_error: dfError,
      p: +p.toFixed(6),
      partial_eta_squared: +partialEta.toFixed(4),
      condition_means: conditionMeans.map((m, i) => `${labels[i]}=${m.toFixed(3)}`).join("; "),
    },
    apa: formatAPA({
      title: "重复测量方差分析",
      test: "Repeated-Measures ANOVA",
      statistic: `F(${dfCondition}, ${dfError}) = ${F.toFixed(2)}`,
      df: `${dfCondition}, ${dfError}`,
      p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
      effect: `partial η² = ${partialEta.toFixed(2)}`,
      conclusion:
        p < 0.05 ? "不同测量条件之间存在显著均值差异。" : "不同测量条件之间未发现显著均值差异。",
      interpretation: `重复测量 ANOVA 基于 ${n} 个完整观测和 ${k} 个测量条件，结果 ${p < 0.05 ? "显著" : "不显著"}，F(${dfCondition}, ${dfError}) = ${F.toFixed(2)}，p ${
        p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
      }。`,
    }),
  };
}

export function runANCOVA(
  y: number[],
  covariate: number[],
  groups: string[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const levels = [...new Set(groups)];
  const dummyRows = groups.map((g) => levels.slice(1).map((level) => (g === level ? 1 : 0)));
  const reduced = fitLinearModel(
    covariate.map((v) => [v]),
    y
  );
  const full = fitLinearModel(
    covariate.map((v, i) => [v, ...dummyRows[i]]),
    y
  );
  const dfEffect = Math.max(1, levels.length - 1);
  const dfError = Math.max(1, full.dfResidual);
  const ssEffect = Math.max(0, reduced.sse - full.sse);
  const msEffect = ssEffect / dfEffect;
  const msError = full.sse / dfError;
  const F = msError > 0 ? msEffect / msError : 0;
  const p = 1 - fDistCDF(F, dfEffect, dfError);
  const partialEta = ssEffect / (ssEffect + full.sse || 1);
  return {
    stats: {
      groups: levels.length,
      n: y.length,
      F: +F.toFixed(4),
      df_effect: dfEffect,
      df_error: dfError,
      p: +p.toFixed(6),
      partial_eta_squared: +partialEta.toFixed(4),
      covariate_r2: +reduced.rSquared.toFixed(4),
    },
    apa: formatAPA({
      title: "协方差分析",
      test: "ANCOVA",
      statistic: `F(${dfEffect}, ${dfError}) = ${F.toFixed(2)}`,
      df: `${dfEffect}, ${dfError}`,
      p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
      effect: `partial η² = ${partialEta.toFixed(2)}`,
      conclusion:
        p < 0.05 ? "控制协变量后，组别对因变量仍有显著影响。" : "控制协变量后，组别效应不显著。",
      interpretation: `ANCOVA 在控制协变量后检验 ${levels.length} 个组别的均值差异，F(${dfEffect}, ${dfError}) = ${F.toFixed(2)}，p ${
        p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`
      }。`,
    }),
  };
}

export function runMANOVA(
  groups: number[][][],
  labels: string[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const g = groups.length;
  const p = labels.length;
  const n = groups.reduce((s, group) => s + group.length, 0);
  const grand = labels.map((_, j) => mean(groups.flat().map((row) => row[j])));
  const W = Array.from({ length: p }, () => Array(p).fill(0) as number[]);
  const B = Array.from({ length: p }, () => Array(p).fill(0) as number[]);

  for (const group of groups) {
    const groupMean = labels.map((_, j) => mean(group.map((row) => row[j])));
    for (const row of group) {
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
          W[i][j] += (row[i] - groupMean[i]) * (row[j] - groupMean[j]);
        }
      }
    }
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        B[i][j] += group.length * (groupMean[i] - grand[i]) * (groupMean[j] - grand[j]);
      }
    }
  }

  const wilks = Math.max(
    0,
    Math.min(
      1,
      Math.abs(determinant(addRidge(W))) /
        Math.max(
          1e-12,
          Math.abs(determinant(addRidge(W.map((row, i) => row.map((v, j) => v + B[i][j])))))
        )
    )
  );
  const T = W.map((row, i) => row.map((v, j) => v + B[i][j]));
  const pillaiMatrix = matMul(B, matInv(addRidge(T)));
  const pillai = pillaiMatrix.reduce((s, row, i) => s + row[i], 0);
  const df1 = p * (g - 1);
  const df2 = Math.max(1, n - g - p + 1);
  const F = wilks > 0 ? ((1 - wilks) / wilks) * (df2 / df1) : 0;
  const pValue = 1 - fDistCDF(F, df1, df2);
  return {
    stats: {
      groups: g,
      outcomes: p,
      n,
      Wilks_lambda: +wilks.toFixed(4),
      Pillai_trace: +pillai.toFixed(4),
      F_approx: +F.toFixed(4),
      df_effect: df1,
      df_error: df2,
      p: +pValue.toFixed(6),
      outcomes_used: labels.join(", "),
    },
    apa: formatAPA({
      title: "多因变量方差分析",
      test: "MANOVA",
      statistic: `Wilks' Λ = ${wilks.toFixed(3)}, F(${df1}, ${df2}) = ${F.toFixed(2)}`,
      df: `${df1}, ${df2}`,
      p: `${pValue < 0.001 ? "< .001" : `= ${pValue.toFixed(3)}`}`,
      effect: `Pillai's Trace = ${pillai.toFixed(2)}`,
      conclusion:
        pValue < 0.05
          ? "组别对多变量结果组合存在显著影响。"
          : "组别对多变量结果组合未达到显著影响。",
      interpretation: `MANOVA 使用 ${p} 个因变量和 ${g} 个组别。Wilks' Λ = ${wilks.toFixed(3)}，近似 F(${df1}, ${df2}) = ${F.toFixed(2)}，p ${
        pValue < 0.001 ? "< .001" : `= ${pValue.toFixed(3)}`
      }。`,
    }),
  };
}
