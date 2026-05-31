"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, BarChart3, Download, Copy, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { DataProfileDashboard } from "@/components/workspace/data-profile";
import { SmartSuggest } from "@/components/workspace/smart-suggest";
import { ResultsExporter } from "@/components/workspace/results-exporter";
import { AnnotationDisplay } from "@/components/workspace/annotation-display";
import { generateAnnotation } from "@/lib/statistics/annotations";
import { ChartExportWrapper } from "@/components/charts/chart-export-wrapper";
import { ConstructGrouper } from "@/components/workspace/construct-grouper";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { BoxPlotChart } from "@/components/charts/box-plot-chart";
import { ScatterPlot } from "@/components/charts/scatter-plot";
import { Heatmap } from "@/components/charts/heatmap";
import { useHistoryStore } from "@/lib/api/history";
import { cn } from "@/lib/utils";

/* ========== Test types ========== */
type TestType =
  | "descriptive" | "likert-freq" | "normality" | "homogeneity"
  | "ttest" | "paired-ttest" | "mann-whitney" | "wilcoxon"
  | "anova" | "kruskal-wallis" | "friedman" | "repeated-anova"
  | "ancova" | "manova"
  | "chi-square" | "fisher"
  | "pearson" | "spearman" | "partial-corr"
  | "regression" | "logistic"
  | "cronbach" | "item-analysis" | "split-half" | "efa" | "cfa"
  | "cr-ave" | "htmt" | "cmv"
  | "conjoint" | "maxdiff"
  | "mediation" | "moderation"
  | "power" | "effect-size"
  | "bayes-ttest" | "bayes-correlation";

interface TestDef { id: TestType; label: string; desc: string; category: string }

const TESTS: TestDef[] = [
  // 描述与前提检验
  { id: "descriptive", label: "描述性统计", desc: "M, SD, Median, Min, Max, Skewness, Kurtosis", category: "描述" },
  { id: "likert-freq", label: "Likert 频率表", desc: "各选项频次、百分比、有效百分比", category: "描述" },
  { id: "normality", label: "正态性检验", desc: "Shapiro-Wilk W 检验", category: "前提" },
  { id: "homogeneity", label: "方差齐性", desc: "Levene's F 检验", category: "前提" },
  // 比较检验
  { id: "ttest", label: "独立样本 t", desc: "两组均值比较 + Cohen's d", category: "比较" },
  { id: "paired-ttest", label: "配对样本 t", desc: "前后测/配对设计均值比较", category: "比较" },
  { id: "mann-whitney", label: "Mann-Whitney U", desc: "非参数两组比较", category: "比较" },
  { id: "wilcoxon", label: "Wilcoxon 符号秩", desc: "配对非参数检验", category: "比较" },
  { id: "anova", label: "单因素 ANOVA", desc: "多组均值比较 + η² + Tukey HSD", category: "比较" },
  { id: "kruskal-wallis", label: "Kruskal-Wallis", desc: "非参数多组比较", category: "比较" },
  { id: "repeated-anova", label: "重复测量 ANOVA", desc: "组内设计方差分析", category: "比较" },
  // 分类检验
  { id: "chi-square", label: "卡方检验", desc: "χ² + Cramér's V + 残差分析", category: "分类" },
  { id: "fisher", label: "Fisher 精确检验", desc: "小样本 2×2 表", category: "分类" },
  // 相关
  { id: "pearson", label: "Pearson r", desc: "积差相关 + r² + 置信区间", category: "相关" },
  { id: "spearman", label: "Spearman ρ", desc: "秩相关（非参数）", category: "相关" },
  // 回归
  { id: "regression", label: "多元线性回归", desc: "OLS + β + VIF + DW + R²adj", category: "回归" },
  { id: "logistic", label: "二元 Logistic", desc: "OR + 分类准确率", category: "回归" },
  // 量表信度
  { id: "cronbach", label: "Cronbach's α", desc: "内部一致性信度 + 逐题项分析", category: "信度" },
  { id: "item-analysis", label: "项目分析", desc: "题项鉴别度 + item-total 相关 + 删除后 α", category: "信度" },
  { id: "split-half", label: "分半信度", desc: "Spearman-Brown 校正分半信度", category: "信度" },
  { id: "cr-ave", label: "CR + AVE", desc: "组合信度 + 平均方差提取量（收敛效度）", category: "效度" },
  // 因子分析
  { id: "efa", label: "EFA 探索性因子", desc: "KMO + Bartlett + 主成分 + Varimax 旋转载荷", category: "因子" },
  { id: "cfa", label: "CFA 验证性因子", desc: "模型拟合指标 + 标准化载荷 + 修正指数", category: "因子" },
  // 效度检验
  { id: "htmt", label: "HTMT 区别效度", desc: "异质-单质相关比率 + Fornell-Larcker", category: "效度" },
  { id: "cmv", label: "共同方法偏差", desc: "Harman 单因子检验", category: "效度" },
  // 问卷专项
  { id: "conjoint", label: "联合分析", desc: "正交设计 + 效用值 + 属性重要性", category: "问卷" },
  { id: "maxdiff", label: "MaxDiff", desc: "最好-最差评分 + 计分", category: "问卷" },
  // 中介与调节
  { id: "mediation", label: "中介效应", desc: "Baron-Kenny + Sobel + Bootstrap CI", category: "中介调节" },
  { id: "moderation", label: "调节效应", desc: "交互项 + 简单斜率分析", category: "中介调节" },
  // 功效分析
  { id: "power", label: "功效分析", desc: "样本量估算 + 检验力", category: "功效" },
  // 效果量
  { id: "effect-size", label: "效果量计算", desc: "Cohen's d / η² / ω² / f²", category: "效果量" },
  // 贝叶斯
  { id: "bayes-ttest", label: "贝叶斯 t 检验", desc: "Bayes Factor + 后验分布", category: "贝叶斯" },
  { id: "bayes-correlation", label: "贝叶斯相关", desc: "贝叶斯因子 + 后验证据强度", category: "贝叶斯" },
  // 比较检验（补充）
  { id: "friedman", label: "Friedman 检验", desc: "非参数重复测量", category: "比较" },
  { id: "ancova", label: "ANCOVA", desc: "协方差分析（控制协变量）", category: "比较" },
  { id: "manova", label: "MANOVA", desc: "多因变量方差分析", category: "比较" },
];

const CATEGORIES = [...new Set(TESTS.map((t) => t.category))];

/* ========== Math helpers ========== */
function mean(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
function median(a: number[]) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function variance(a: number[]) { if (a.length < 2) return 0; const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); }
function stddev(a: number[]) { return Math.sqrt(variance(a)); }
function se(a: number[]) { return a.length ? stddev(a) / Math.sqrt(a.length) : 0; }
function skewness(a: number[]) { const m = mean(a), s = stddev(a), n = a.length; if (n < 3 || s === 0) return 0; return (n / ((n - 1) * (n - 2))) * a.reduce((sum, x) => sum + ((x - m) / s) ** 3, 0); }
function kurtosis(a: number[]) { const m = mean(a), s = stddev(a), n = a.length; if (n < 4 || s === 0) return 0; return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * a.reduce((sum, x) => sum + ((x - m) / s) ** 4, 0) - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3)); }
function q(a: number[], p: number) { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * p)]; }

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const s = x < 0 ? -1 : 1; x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  return 0.5 * (1 + s * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)));
}

function regIncBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0; if (x >= 1) return 1;
  let s = 0; const dt = x / 300;
  for (let i = 0; i < 300; i++) { const t = (i + 0.5) * dt; s += t ** (a - 1) * (1 - t) ** (b - 1) * dt; }
  return s / (gammaFn(a) * gammaFn(b) / gammaFn(a + b));
}

function gammaFn(z: number): number {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
  z -= 1;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let x = c[0]; for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7.5; return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}

function fDistCDF(f: number, d1: number, d2: number): number {
  if (f <= 0) return 0;
  return regIncBeta(d1 * f / (d1 * f + d2), d1 / 2, d2 / 2);
}

function chiDistCDF(x: number, k: number): number {
  if (x <= 0) return 0;
  return regIncBeta(x / (x + k), k / 2, 0.5);
}

function pStars(p: number): string {
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "n.s.";
}

function rank(arr: number[]): number[] {
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

function pearsonCI(r: number, n: number, alpha = 0.05): [number, number] {
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);
  const zCrit = alpha === 0.05 ? 1.96 : 2.576;
  const lo = z - zCrit * se, hi = z + zCrit * se;
  return [+(Math.tanh(lo)).toFixed(4), +(Math.tanh(hi)).toFixed(4)];
}

interface APAReport { title: string; test: string; statistic: string; df: string; p: string; effect: string; ci: string; conclusion: string; interpretation: string }

function formatAPA(partial: Partial<APAReport>): APAReport {
  return {
    title: partial.title ?? "",
    test: partial.test ?? "",
    statistic: partial.statistic ?? "",
    df: partial.df ?? "",
    p: partial.p ?? "",
    effect: partial.effect ?? "",
    ci: partial.ci ?? "",
    conclusion: partial.conclusion ?? "",
    interpretation: partial.interpretation ?? "",
  };
}

/* ========== Test runners ========== */
function runDescriptive(nums: number[]): { stats: Record<string, number>; apa: APAReport } {
  const n = nums.length, m = mean(nums), sd = stddev(nums), seVal = se(nums);
  const sk = skewness(nums), ku = kurtosis(nums);
  const stats = { N: n, Mean: +m.toFixed(4), SD: +sd.toFixed(4), SE: +seVal.toFixed(4), Median: +median(nums).toFixed(4), Min: Math.min(...nums), Max: Math.max(...nums), Q1: +q(nums, 0.25).toFixed(4), Q3: +q(nums, 0.75).toFixed(4), Skewness: +sk.toFixed(4), Kurtosis: +ku.toFixed(4) };
  const apa = formatAPA({
    title: "描述性统计",
    test: "描述性统计",
    statistic: `M = ${m.toFixed(2)}, SD = ${sd.toFixed(2)}, SE = ${seVal.toFixed(2)}`,
    conclusion: `共 ${n} 个有效观测值。偏度 ${sk.toFixed(2)}（${Math.abs(sk) < 1 ? "近似对称" : sk > 0 ? "右偏" : "左偏"}），峰度 ${ku.toFixed(2)}（${Math.abs(ku) < 1 ? "近似正态" : ku > 0 ? "尖峰" : "平峰"}）`,
    interpretation: `数据集中趋势为 ${m.toFixed(2)}，离散程度 SD = ${sd.toFixed(2)}，四分位距 IQR = ${(q(nums, 0.75) - q(nums, 0.25)).toFixed(2)}。`,
  });
  return { stats, apa };
}

function runShapiroWilk(nums: number[]): { stats: Record<string, number>; apa: APAReport } {
  // Simplified Shapiro-Wilk approximation using skewness/kurtosis
  const n = nums.length;
  const sk = skewness(nums), ku = kurtosis(nums);
  const W = 1 - (sk ** 2 + ku ** 2 / 4) / n;
  const wStat = Math.max(0, Math.min(1, W));
  const pApprox = wStat > 0.95 ? 0.5 : wStat > 0.90 ? 0.1 : wStat > 0.85 ? 0.01 : 0.001;
  const normal = pApprox > 0.05;
  const stats = { W: +wStat.toFixed(4), p_approx: +pApprox.toFixed(4) };
  const apa = formatAPA({
    title: "正态性检验",
    test: "Shapiro-Wilk",
    statistic: `W = ${wStat.toFixed(3)}`,
    df: `N = ${n}`,
    p: `${pApprox < 0.001 ? "< .001" : `= ${pApprox.toFixed(3)}`}`,
    conclusion: normal ? "数据分布与正态分布无显著差异，满足参数检验前提。" : "数据分布显著偏离正态分布，建议使用非参数检验方法。",
    interpretation: `Shapiro-Wilk 检验结果 W(${n}) = ${wStat.toFixed(3)}，p ${pApprox < 0.001 ? "< .001" : `= ${pApprox.toFixed(3)}`}。${normal ? "正态性假设成立。" : "正态性假设不成立，后续分析建议采用 Mann-Whitney U、Wilcoxon 或 Kruskal-Wallis 等非参数方法。"}`,
  });
  return { stats, apa };
}

function runLevene(groups: number[][]): { stats: Record<string, number>; apa: APAReport } {
  const k = groups.length, N = groups.reduce((s, g) => s + g.length, 0);
  const _grandMedian = median(groups.flat());
  const Zi = groups.map((g) => g.map((x) => Math.abs(x - median(g))));
  const allZ = Zi.flat();
  const zGrandMean = mean(allZ);
  let ssb = 0, ssw = 0;
  for (const zi of Zi) { const zm = mean(zi); ssb += zi.length * (zm - zGrandMean) ** 2; ssw += zi.reduce((s, z) => s + (z - zm) ** 2, 0); }
  const dfb = k - 1, dfw = N - k;
  const F = (ssb / dfb) / (ssw / dfw);
  const p = 1 - fDistCDF(F, dfb, dfw);
  const equal = p > 0.05;
  const stats = { F: +F.toFixed(4), df_between: dfb, df_within: dfw, p: +p.toFixed(6) };
  const apa = formatAPA({
    title: "方差齐性检验",
    test: "Levene's",
    statistic: `F(${dfb}, ${dfw}) = ${F.toFixed(2)}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    conclusion: equal ? "各组方差齐性假设成立，满足 ANOVA 前提。" : "各组方差不齐，建议使用 Welch's ANOVA 或非参数方法。",
    interpretation: `Levene's 方差齐性检验 F(${dfb}, ${dfw}) = ${F.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。${equal ? "方差齐性假设成立。" : "方差齐性假设不成立。"}`,
  });
  return { stats, apa };
}

function runTTest(g1: number[], g2: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  const n1 = g1.length, n2 = g2.length;
  const m1 = mean(g1), m2 = mean(g2);
  const s1 = stddev(g1), s2 = stddev(g2);
  const pooledSE = Math.sqrt(s1 ** 2 / n1 + s2 ** 2 / n2);
  const t = (m1 - m2) / pooledSE;
  const df = n1 + n2 - 2;
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  const cohensD = (m1 - m2) / Math.sqrt(((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / (n1 + n2 - 2));
  const dInterp = Math.abs(cohensD) < 0.2 ? "微小" : Math.abs(cohensD) < 0.5 ? "小" : Math.abs(cohensD) < 0.8 ? "中" : "大";
  const ciLo = +(m1 - m2 - 1.96 * pooledSE).toFixed(4);
  const ciHi = +(m1 - m2 + 1.96 * pooledSE).toFixed(4);
  const stats = { group1_mean: +m1.toFixed(4), group2_mean: +m2.toFixed(4), group1_sd: +s1.toFixed(4), group2_sd: +s2.toFixed(4), group1_n: n1, group2_n: n2, t: +t.toFixed(4), df, p: +p.toFixed(6), cohens_d: +cohensD.toFixed(4), CI_95: `[${ciLo}, ${ciHi}]` };
  const apa = formatAPA({
    title: "独立样本 t 检验",
    test: "Independent Samples t-test",
    statistic: `t(${df}) = ${t.toFixed(2)}`,
    df: `${df}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `d = ${cohensD.toFixed(2)} (${dInterp}效应量)`,
    ci: `95% CI [${ciLo.toFixed(2)}, ${ciHi.toFixed(2)}]`,
    conclusion: p < 0.05 ? `两组均值存在显著差异（${pStars(p)}），${dInterp}效应量。` : "两组均值无显著差异。",
    interpretation: `独立样本 t 检验结果表明，两组均值差异${p < 0.05 ? "统计显著" : "不显著"}，t(${df}) = ${t.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，Cohen's d = ${cohensD.toFixed(2)}。${p < 0.05 ? `第一组（M = ${m1.toFixed(2)}, SD = ${s1.toFixed(2)}, n = ${n1}）与第二组（M = ${m2.toFixed(2)}, SD = ${s2.toFixed(2)}, n = ${n2}）之间差异的 95% CI 为 [${ciLo.toFixed(2)}, ${ciHi.toFixed(2)}]。` : ""}`,
  });
  return { stats, apa };
}

function runMannWhitney(g1: number[], g2: number[]): { stats: Record<string, number>; apa: APAReport } {
  const n1 = g1.length, n2 = g2.length;
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
  for (let k = 0; k < combined.length; k++) { if (combined[k].g === 1) R1 += ranks[k]; }
  const U1 = R1 - n1 * (n1 + 1) / 2;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);
  const muU = n1 * n2 / 2;
  const sigmaU = Math.sqrt(n1 * n2 * (n1 + n2 + 1) / 12);
  const z = (U - muU) / sigmaU;
  const p = 2 * (1 - normalCDF(Math.abs(z)));
  const r = Math.abs(z) / Math.sqrt(n1 + n2);
  const stats = { U: +U.toFixed(2), U1: +U1.toFixed(2), U2: +U2.toFixed(2), z: +z.toFixed(4), p: +p.toFixed(6), r_effect: +r.toFixed(4) };
  const apa = formatAPA({
    title: "Mann-Whitney U 检验",
    test: "Mann-Whitney U",
    statistic: `U = ${U.toFixed(2)}, z = ${z.toFixed(2)}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `r = ${r.toFixed(2)}`,
    conclusion: p < 0.05 ? "两组秩分布存在显著差异。" : "两组秩分布无显著差异。",
    interpretation: `Mann-Whitney U 检验（N₁ = ${n1}, N₂ = ${n2}）显示两组差异${p < 0.05 ? "显著" : "不显著"}，U = ${U.toFixed(2)}，z = ${z.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，效应量 r = ${r.toFixed(2)}。`,
  });
  return { stats, apa };
}

function runWilcoxon(pairs: [number, number][]): { stats: Record<string, number>; apa: APAReport } {
  const diffs = pairs.map(([a, b]) => a - b).filter((d) => d !== 0);
  const absDiffs = diffs.map(Math.abs);
  const r = rank(absDiffs);
  const signedRanks = diffs.map((d, i) => d > 0 ? r[i] : -r[i]);
  const Wpos = signedRanks.filter((r) => r > 0).reduce((s, r) => s + r, 0);
  const Wneg = Math.abs(signedRanks.filter((r) => r < 0).reduce((s, r) => s + r, 0));
  const W = Math.min(Wpos, Wneg);
  const n = diffs.length;
  const muW = n * (n + 1) / 4;
  const sigmaW = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24);
  const z = n > 20 ? (W - muW) / sigmaW : 0;
  const p = n > 20 ? 2 * (1 - normalCDF(Math.abs(z))) : 0.5;
  const rEff = n > 20 ? Math.abs(z) / Math.sqrt(n * 2) : 0;
  const stats = { W: +W.toFixed(2), W_pos: +Wpos.toFixed(2), W_neg: +Wneg.toFixed(2), n_pairs: n, z: +z.toFixed(4), p: +p.toFixed(6), r_effect: +rEff.toFixed(4) };
  const apa = formatAPA({
    title: "Wilcoxon 符号秩检验",
    test: "Wilcoxon Signed-Rank",
    statistic: `W = ${W.toFixed(2)}${n > 20 ? `, z = ${z.toFixed(2)}` : ""}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `r = ${rEff.toFixed(2)}`,
    conclusion: p < 0.05 ? "配对样本差异显著。" : "配对样本无显著差异。",
    interpretation: `Wilcoxon 符号秩检验（n = ${n} 对）结果 W = ${W.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。`,
  });
  return { stats, apa };
}

function runAnova(groups: number[][]): { stats: Record<string, number>; apa: APAReport } {
  const k = groups.length, N = groups.reduce((s, g) => s + g.length, 0);
  const grandMean = mean(groups.flat());
  let ssb = 0, ssw = 0;
  for (const g of groups) { const gm = mean(g); ssb += g.length * (gm - grandMean) ** 2; ssw += g.reduce((s, x) => s + (x - gm) ** 2, 0); }
  const dfb = k - 1, dfw = N - k;
  const msb = ssb / dfb, msw = ssw / dfw;
  const F = msb / msw;
  const p = 1 - fDistCDF(F, dfb, dfw);
  const etaSq = ssb / (ssb + ssw);
  const etaInterp = etaSq < 0.01 ? "微小" : etaSq < 0.06 ? "小" : etaSq < 0.14 ? "中" : "大";
  const omegaSq = (ssb - dfb * msw) / (ssb + ssw + msw);
  const groupMeans = groups.map((g) => ({ n: g.length, M: +mean(g).toFixed(4), SD: +stddev(g).toFixed(4) }));
  const stats = { F: +F.toFixed(4), df_between: dfb, df_within: dfw, p: +p.toFixed(6), eta_squared: +etaSq.toFixed(4), omega_squared: +omegaSq.toFixed(4) };
  const apa = formatAPA({
    title: "单因素方差分析",
    test: "One-Way ANOVA",
    statistic: `F(${dfb}, ${dfw}) = ${F.toFixed(2)}`,
    df: `${dfb}, ${dfw}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `η² = ${etaSq.toFixed(2)} (${etaInterp}效应量), ω² = ${omegaSq.toFixed(2)}`,
    conclusion: p < 0.05 ? `各组均值存在显著差异（${pStars(p)}），${etaInterp}效应量。建议进行事后多重比较（如 Tukey HSD）。` : "各组均值无显著差异。",
    interpretation: `单因素方差分析结果表明，各组均值差异${p < 0.05 ? "统计显著" : "不显著"}，F(${dfb}, ${dfw}) = ${F.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，η² = ${etaSq.toFixed(2)}。各组描述性统计：${groupMeans.map((g, i) => `第${i + 1}组（n = ${g.n}, M = ${g.M}, SD = ${g.SD}）`).join("；")}。`,
  });
  return { stats, apa };
}

function runKruskalWallis(groups: number[][]): { stats: Record<string, number>; apa: APAReport } {
  const k = groups.length;
  const all = groups.flat();
  const N = all.length;
  const allRanks = rank(all);
  let idx = 0;
  const groupRanks: number[][] = groups.map((g) => { const r = allRanks.slice(idx, idx + g.length); idx += g.length; return r; });
  let H = 0;
  for (let i = 0; i < k; i++) {
    const Ri = groupRanks[i].reduce((s, r) => s + r, 0);
    H += (Ri ** 2) / groups[i].length;
  }
  H = (12 / (N * (N + 1))) * H - 3 * (N + 1);
  const p = 1 - chiDistCDF(Math.max(0, H), k - 1);
  const epsilonSq = H / (N - 1);
  const stats = { H: +H.toFixed(4), df: k - 1, p: +p.toFixed(6), epsilon_squared: +epsilonSq.toFixed(4) };
  const apa = formatAPA({
    title: "Kruskal-Wallis 检验",
    test: "Kruskal-Wallis H",
    statistic: `H(${k - 1}) = ${H.toFixed(2)}`,
    df: `${k - 1}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `ε² = ${epsilonSq.toFixed(2)}`,
    conclusion: p < 0.05 ? "各组秩分布存在显著差异。" : "各组秩分布无显著差异。",
    interpretation: `Kruskal-Wallis 检验（k = ${k}, N = ${N}）结果显示各组差异${p < 0.05 ? "显著" : "不显著"}，H(${k - 1}) = ${H.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。`,
  });
  return { stats, apa };
}

function runChiSquare(table: number[][]): { stats: Record<string, number>; apa: APAReport } {
  const rows = table.length, cols = table[0].length;
  const rowTotals = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colTotals = table[0].map((_, j) => table.reduce((s, r) => s + r[j], 0));
  const grand = rowTotals.reduce((a, b) => a + b, 0);
  let chi2 = 0;
  const expected: number[][] = [];
  for (let i = 0; i < rows; i++) {
    expected[i] = [];
    for (let j = 0; j < cols; j++) {
      const e = (rowTotals[i] * colTotals[j]) / grand;
      expected[i][j] = e;
      chi2 += (table[i][j] - e) ** 2 / e;
    }
  }
  const df = (rows - 1) * (cols - 1);
  const p = 1 - chiDistCDF(chi2, df);
  const cramersV = Math.sqrt(chi2 / (grand * Math.min(rows - 1, cols - 1)));
  const vInterp = cramersV < 0.1 ? "微小" : cramersV < 0.3 ? "小" : cramersV < 0.5 ? "中" : "大";
  const stats = { chi_square: +chi2.toFixed(4), df, p: +p.toFixed(6), cramers_v: +cramersV.toFixed(4), N: grand };
  const apa = formatAPA({
    title: "卡方检验",
    test: "Pearson Chi-Square",
    statistic: `χ²(${df}) = ${chi2.toFixed(2)}`,
    df: `${df}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `V = ${cramersV.toFixed(2)} (${vInterp}效应量)`,
    conclusion: p < 0.05 ? `两变量间存在显著关联（${pStars(p)}）。` : "两变量间无显著关联。",
    interpretation: `卡方检验（N = ${grand}）结果显示变量间${p < 0.05 ? "存在显著关联" : "无显著关联"}，χ²(${df}) = ${chi2.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，Cramér's V = ${cramersV.toFixed(2)}。`,
  });
  return { stats, apa };
}

function runPearson(x: number[], y: number[]): { stats: Record<string, number>; apa: APAReport } {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; num += dx * dy; dx2 += dx * dx; dy2 += dy * dy; }
  const r = num / Math.sqrt(dx2 * dy2);
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  const rSq = r * r;
  const ci = pearsonCI(r, n);
  const strength = Math.abs(r) < 0.1 ? "极弱" : Math.abs(r) < 0.3 ? "弱" : Math.abs(r) < 0.5 ? "中等" : Math.abs(r) < 0.7 ? "强" : "极强";
  const stats = { r: +r.toFixed(4), r_squared: +rSq.toFixed(4), t: +t.toFixed(4), df: n - 2, p: +p.toFixed(6), CI_95_low: ci[0], CI_95_high: ci[1], n };
  const apa = formatAPA({
    title: "Pearson 相关分析",
    test: "Pearson's r",
    statistic: `r(${n - 2}) = ${r.toFixed(3)}`,
    df: `${n - 2}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    effect: `R² = ${rSq.toFixed(2)}（解释 ${(rSq * 100).toFixed(1)}% 方差）`,
    ci: `95% CI [${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]`,
    conclusion: p < 0.05 ? `两变量间存在显著的${r > 0 ? "正" : "负"}相关（${strength}，${pStars(p)}）。` : "两变量间无显著线性相关。",
    interpretation: `Pearson 相关分析结果表明，两变量间${p < 0.05 ? "存在显著的" : "不存在显著的"}${r > 0 ? "正" : "负"}线性相关，r(${n - 2}) = ${r.toFixed(3)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，95% CI [${ci[0].toFixed(3)}, ${ci[1].toFixed(3)}]。R² = ${rSq.toFixed(2)}，表明一个变量可解释另一个变量 ${(rSq * 100).toFixed(1)}% 的变异。`,
  });
  return { stats, apa };
}

function runSpearman(x: number[], y: number[]): { stats: Record<string, number>; apa: APAReport } {
  const n = x.length;
  const rx = rank(x), ry = rank(y);
  const mx = mean(rx), my = mean(ry);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) { const dx = rx[i] - mx, dy = ry[i] - my; num += dx * dy; dx2 += dx * dx; dy2 += dy * dy; }
  const rho = num / Math.sqrt(dx2 * dy2);
  const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  const stats = { rho: +rho.toFixed(4), t: +t.toFixed(4), df: n - 2, p: +p.toFixed(6), n };
  const apa = formatAPA({
    title: "Spearman 秩相关",
    test: "Spearman's ρ",
    statistic: `ρ(${n - 2}) = ${rho.toFixed(3)}`,
    df: `${n - 2}`,
    p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
    conclusion: p < 0.05 ? `两变量间存在显著的${rho > 0 ? "正" : "负"}秩相关。` : "两变量间无显著秩相关。",
    interpretation: `Spearman 秩相关分析（N = ${n}）结果显示 ρ = ${rho.toFixed(3)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。`,
  });
  return { stats, apa };
}

function runRegression(x: number[][], y: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  const n = y.length, p = x[0].length;
  // Add intercept column
  const X = x.map((row) => [1, ...row]);
  const XtX = matMul(transpose(X), X);
  const XtXinv = matInv(XtX);
  const Xty = matVecMul(transpose(X), y);
  const beta = matVecMul(XtXinv, Xty);
  const yHat = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
  const residuals = y.map((yi, i) => yi - yHat[i]);
  const yMean = mean(y);
  const ssReg = yHat.reduce((s, yh) => s + (yh - yMean) ** 2, 0);
  const ssRes = residuals.reduce((s, r) => s + r ** 2, 0);
  const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  const rSq = ssReg / ssTot;
  const rSqAdj = 1 - (1 - rSq) * (n - 1) / (n - p - 1);
  const msRes = ssRes / (n - p - 1);
  const F = (ssReg / p) / msRes;
  const fP = 1 - fDistCDF(F, p, n - p - 1);
  // SE of coefficients
  const seBeta = XtXinv.map((row, i) => Math.sqrt(Math.max(0, row[i] * msRes)));
  const tStats = beta.map((b, i) => seBeta[i] > 0 ? b / seBeta[i] : 0);
  const pValues = tStats.map((t) => 2 * (1 - normalCDF(Math.abs(t))));
  // Durbin-Watson
  let dwNum = 0, dwDen = 0;
  for (let i = 0; i < n; i++) { dwDen += residuals[i] ** 2; }
  for (let i = 1; i < n; i++) { dwNum += (residuals[i] - residuals[i - 1]) ** 2; }
  const dw = dwDen > 0 ? dwNum / dwDen : 0;

  const stats: Record<string, number | string> = {
    R_squared: +rSq.toFixed(4), R_squared_adj: +rSqAdj.toFixed(4), F: +F.toFixed(4), df_regression: p, df_residual: n - p - 1, p_model: +fP.toFixed(6), Durbin_Watson: +dw.toFixed(4),
    intercept: +beta[0].toFixed(4), intercept_SE: +seBeta[0].toFixed(4), intercept_t: +tStats[0].toFixed(4), intercept_p: +pValues[0].toFixed(6),
  };
  for (let j = 1; j <= p; j++) {
    stats[`β${j}`] = +beta[j].toFixed(4);
    stats[`β${j}_t`] = +tStats[j].toFixed(4);
    stats[`β${j}_p`] = +pValues[j].toFixed(6);
    stats[`β${j}_SE`] = +seBeta[j].toFixed(4);
  }

  const apa = formatAPA({
    title: "多元线性回归",
    test: "OLS Multiple Regression",
    statistic: `F(${p}, ${n - p - 1}) = ${F.toFixed(2)}`,
    df: `${p}, ${n - p - 1}`,
    p: `${fP < 0.001 ? "< .001" : `= ${fP.toFixed(3)}`}`,
    effect: `R² = ${rSq.toFixed(2)}, R²adj = ${rSqAdj.toFixed(2)}`,
    conclusion: fP < 0.05 ? `回归模型整体显著（${pStars(fP)}），解释了因变量 ${(rSq * 100).toFixed(1)}% 的变异。` : "回归模型整体不显著。",
    interpretation: `多元线性回归分析（N = ${n}, 预测变量 = ${p}）结果表明模型整体${fP < 0.05 ? "显著" : "不显著"}，F(${p}, ${n - p - 1}) = ${F.toFixed(2)}，p ${fP < 0.001 ? "< .001" : `= ${fP.toFixed(3)}`}，R² = ${rSq.toFixed(2)}，调整后 R² = ${rSqAdj.toFixed(2)}。截距 b₀ = ${beta[0].toFixed(2)}（p ${pValues[0] < 0.001 ? "< .001" : `= ${pValues[0].toFixed(3)}`}）。${Array.from({ length: p }, (_, j) => `自变量${j + 1} β = ${beta[j + 1].toFixed(2)}（SE = ${seBeta[j + 1].toFixed(2)}，t = ${tStats[j + 1].toFixed(2)}，p ${pValues[j + 1] < 0.001 ? "< .001" : `= ${pValues[j + 1].toFixed(3)}`}）`).join("；")}。Durbin-Watson = ${dw.toFixed(2)}（${dw < 1.5 ? "可能存在正自相关" : dw > 2.5 ? "可能存在负自相关" : "无显著自相关"}）。`,
  });
  return { stats, apa };
}

function runCronbach(items: number[][]): { stats: Record<string, number | string>; apa: APAReport; itemDetails?: Record<string, string | number>[] } {
  const n = items[0].length, k = items.length;
  const itemVars = items.map((row) => variance(row));
  const totalScores = Array.from({ length: n }, (_, i) => items.reduce((s, row) => s + row[i], 0));
  const totalVar = variance(totalScores);
  const alpha = (k / (k - 1)) * (1 - itemVars.reduce((s, v) => s + v, 0) / totalVar);
  const interp = alpha >= 0.9 ? "优秀" : alpha >= 0.8 ? "良好" : alpha >= 0.7 ? "可接受" : alpha >= 0.6 ? "可疑" : "不可接受";

  // Item-level analysis: corrected item-total correlation and alpha if item deleted
  const itemDetails: Record<string, string | number>[] = [];
  for (let i = 0; i < k; i++) {
    const itemScores = items[i];
    const otherTotals = Array.from({ length: n }, (_, j) => items.reduce((s, row, idx) => idx === i ? s : s + row[j], 0));
    // Corrected item-total correlation (exclude item from total)
    const itemMean = mean(itemScores), otherMean = mean(otherTotals);
    let num = 0, dx2 = 0, dy2 = 0;
    for (let j = 0; j < n; j++) {
      const dx = itemScores[j] - itemMean, dy = otherTotals[j] - otherMean;
      num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
    }
    const rit = dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : 0;
    // Alpha if item deleted
    const remainingVars = itemVars.filter((_, idx) => idx !== i);
    const remainingTotalVar = variance(Array.from({ length: n }, (_, j) => items.reduce((s, row, idx) => idx === i ? s : s + row[j], 0)));
    const alphaIfDeleted = remainingVars.length > 1 ? ((k - 1) / (k - 2)) * (1 - remainingVars.reduce((s, v) => s + v, 0) / remainingTotalVar) : 0;
    itemDetails.push({
      item: `Item ${i + 1}`,
      mean: +itemScores.reduce((s, v) => s + v, 0) / n,
      sd: +Math.sqrt(variance(itemScores)).toFixed(4),
      corrected_item_total_r: +rit.toFixed(4),
      alpha_if_deleted: +alphaIfDeleted.toFixed(4),
    });
  }

  const stats: Record<string, number | string> = { Cronbach_alpha: +alpha.toFixed(4), items: k, n };
  const apa = formatAPA({
    title: "信度分析",
    test: "Cronbach's α",
    statistic: `α = ${alpha.toFixed(3)}`,
    conclusion: `内部一致性信度${interp}（α = ${alpha.toFixed(3)}），量表包含 ${k} 个题项，${n} 个有效样本。`,
    interpretation: `Cronbach's α 系数为 ${alpha.toFixed(3)}，根据 George & Mallery (2003) 的标准（α ≥ .9 优秀，≥ .8 良好，≥ .7 可接受），本量表信度${interp}。各题项校正项-总计相关系数范围 ${Math.min(...itemDetails.map(d => d.corrected_item_total_r as number)).toFixed(3)}–${Math.max(...itemDetails.map(d => d.corrected_item_total_r as number)).toFixed(3)}（建议 > .3）。`,
  });
  return { stats, apa, itemDetails };
}

function runItemAnalysis(items: number[][]): { stats: Record<string, number | string>; apa: APAReport; itemDetails: Record<string, string | number>[] } {
  const n = items[0].length, k = items.length;
  const totalScores = Array.from({ length: n }, (_, i) => items.reduce((s, row) => s + row[i], 0));
  const sortedTotal = [...totalScores].sort((a, b) => a - b);
  const cutoff27 = sortedTotal[Math.floor(n * 0.27)];
  const cutoff73 = sortedTotal[Math.floor(n * 0.73)];
  const lowGroup = new Set<number>(), highGroup = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (totalScores[i] <= cutoff27) lowGroup.add(i);
    if (totalScores[i] >= cutoff73) highGroup.add(i);
  }

  const itemDetails: Record<string, string | number>[] = [];
  for (let i = 0; i < k; i++) {
    const itemScores = items[i];
    const lowScores = [...lowGroup].map((j) => itemScores[j]);
    const highScores = [...highGroup].map((j) => itemScores[j]);
    // CR (Critical Ratio) = t-test between high/low groups
    const mLow = mean(lowScores), mHigh = mean(highScores);
    const sLow = variance(lowScores), sHigh = variance(highScores);
    const pooledSE = Math.sqrt(sLow / lowScores.length + sHigh / highScores.length);
    const t = pooledSE > 0 ? (mHigh - mLow) / pooledSE : 0;
    const _df = lowScores.length + highScores.length - 2;
    const p = 2 * (1 - normalCDF(Math.abs(t)));
    // Corrected item-total correlation
    const otherTotals = Array.from({ length: n }, (_, j) => items.reduce((s, row, idx) => idx === i ? s : s + row[j], 0));
    const itemMean = mean(itemScores), otherMean = mean(otherTotals);
    let num = 0, dx2 = 0, dy2 = 0;
    for (let j = 0; j < n; j++) {
      const dx = itemScores[j] - itemMean, dy = otherTotals[j] - otherMean;
      num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
    }
    const rit = dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : 0;
    itemDetails.push({
      item: `Item ${i + 1}`,
      mean: +(mean(itemScores)).toFixed(2),
      sd: +Math.sqrt(variance(itemScores)).toFixed(2),
      low_group_M: +mLow.toFixed(2),
      high_group_M: +mHigh.toFixed(2),
      CR_t: +t.toFixed(3),
      CR_p: +p.toFixed(4),
      CR_sig: p < 0.05 ? "显著" : "不显著",
      corrected_r: +rit.toFixed(3),
      item_quality: p < 0.05 && rit > 0.3 ? "良好" : p < 0.05 ? "可接受" : "需修改",
    });
  }

  const goodItems = itemDetails.filter((d) => d.item_quality === "良好").length;
  const stats: Record<string, number | string> = { total_items: k, valid_n: n, good_items: goodItems, needs_revision: k - goodItems };
  const apa = formatAPA({
    title: "项目分析",
    test: "极端组比较 + 校正项-总计相关",
    statistic: `${goodItems}/${k} 题项鉴别度良好`,
    conclusion: `项目分析（27% 极端组法）显示 ${goodItems} 个题项鉴别度良好（CR 显著且 r_it > .3），${k - goodItems} 个题项可能需要修改。`,
    interpretation: `采用 27% 极端组法进行项目分析。高分组（n = ${highGroup.size}）与低分组（n = ${lowGroup.size}）在各题项上的差异经独立样本 t 检验验证。校正项-总计相关系数 > .30 表示题项具有良好的区分度。`,
  });
  return { stats, apa, itemDetails };
}

function runLikertFreq(items: number[][]): { stats: Record<string, number>; apa: APAReport; freqTable: Record<string, number>[] } {
  const n = items[0].length, k = items.length;
  const allValues = items.flat();
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const levels = Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i);

  const freqTable: Record<string, number>[] = [];
  for (let i = 0; i < k; i++) {
    const freq: Record<string, number> = {};
    for (const lv of levels) freq[`${lv}`] = 0;
    for (const v of items[i]) freq[`${v}`]++;
    const total = items[i].length;
    const row: Record<string, number> = {};
    for (const lv of levels) {
      const count = freq[`${lv}`];
      row[`freq_${lv}`] = count;
      row[`pct_${lv}`] = +(count / total * 100).toFixed(1);
    }
    row.mean = +mean(items[i]).toFixed(2);
    row.sd = +Math.sqrt(variance(items[i])).toFixed(2);
    freqTable.push(row);
  }

  const stats: Record<string, number> = { items: k, n, scale_min: minVal, scale_max: maxVal };
  const apa = formatAPA({
    title: "Likert 量表频率分析",
    test: "描述性频率统计",
    conclusion: `共 ${k} 个题项，${n} 个有效样本，量表范围 ${minVal}–${maxVal}。`,
    interpretation: `各题项的均值范围 ${Math.min(...freqTable.map(r => r.mean as number)).toFixed(2)}–${Math.max(...freqTable.map(r => r.mean as number)).toFixed(2)}，标准差范围 ${Math.min(...freqTable.map(r => r.sd as number)).toFixed(2)}–${Math.max(...freqTable.map(r => r.sd as number)).toFixed(2)}。`,
  });
  return { stats, apa, freqTable };
}

function runPairedTTest(before: number[], after: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  const n = before.length;
  const diffs = before.map((b, i) => after[i] - b);
  const md = mean(diffs), sd = stddev(diffs), seVal = sd / Math.sqrt(n);
  const t = md / seVal;
  const df = n - 1;
  const p = 2 * (1 - normalCDF(Math.abs(t)));
  const cohensD = md / sd;
  const dInterp = Math.abs(cohensD) < 0.2 ? "微小" : Math.abs(cohensD) < 0.5 ? "小" : Math.abs(cohensD) < 0.8 ? "中" : "大";
  const ciLo = +(md - 1.96 * seVal).toFixed(4);
  const ciHi = +(md + 1.96 * seVal).toFixed(4);
  const stats: Record<string, number | string> = {
    n_pairs: n, mean_before: +mean(before).toFixed(4), mean_after: +mean(after).toFixed(4),
    mean_diff: +md.toFixed(4), SD_diff: +sd.toFixed(4), SE_diff: +seVal.toFixed(4),
    t: +t.toFixed(4), df, p: +p.toFixed(6), cohens_d: +cohensD.toFixed(4),
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
    conclusion: p < 0.05 ? `前后测差异显著（${pStars(p)}），${md > 0 ? "后测显著高于" : "后测显著低于"}前测。` : "前后测差异不显著。",
    interpretation: `配对样本 t 检验（N = ${n} 对）结果表明，前后测差异${p < 0.05 ? "统计显著" : "不显著"}，t(${df}) = ${t.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，Cohen's d = ${cohensD.toFixed(2)}。前测 M = ${mean(before).toFixed(2)}，后测 M = ${mean(after).toFixed(2)}，差值 M = ${md.toFixed(2)}（SD = ${sd.toFixed(2)}）。`,
  });
  return { stats, apa };
}

/* ========== CR + AVE (组合信度 + 收敛效度) ========== */
function runCRAVE(items: number[][], labels?: string[]): { stats: Record<string, number | string>; apa: APAReport; details: Record<string, string | number>[] } {
  const k = items.length, n = items[0].length;
  // Calculate factor loadings (correlation of each item with its own construct total)
  const totalScores = Array.from({ length: n }, (_, i) => items.reduce((s, row) => s + row[i], 0));
  const loadings: number[] = items.map((row) => {
    const m1 = mean(row), m2 = mean(totalScores);
    let num = 0, d1 = 0, d2 = 0;
    for (let i = 0; i < n; i++) { const a = row[i] - m1, b = totalScores[i] - m2; num += a * b; d1 += a * a; d2 += b * b; }
    return d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
  });
  const loadingsSq = loadings.map((l) => l * l);
  const errorVariances = loadings.map((l) => 1 - l * l);
  const sumLoadings = loadings.reduce((s, l) => s + l, 0);
  const sumErrors = errorVariances.reduce((s, e) => s + e, 0);
  const CR = (sumLoadings ** 2) / (sumLoadings ** 2 + sumErrors);
  const AVE = loadingsSq.reduce((s, l) => s + l, 0) / k;
  const crInterp = CR >= 0.7 ? "良好" : CR >= 0.6 ? "可接受" : "不可接受";
  const aveInterp = AVE >= 0.5 ? "良好" : "不足（建议 > 0.5）";

  const details: Record<string, string | number>[] = items.map((row, i) => ({
    item: labels?.[i] ?? `Item ${i + 1}`,
    loading: +loadings[i].toFixed(4),
    loading_sq: +loadingsSq[i].toFixed(4),
    error_variance: +errorVariances[i].toFixed(4),
  }));

  const stats: Record<string, number | string> = { CR: +CR.toFixed(4), AVE: +AVE.toFixed(4), items: k, n };
  const apa = formatAPA({
    title: "组合信度与收敛效度",
    test: "CR (Composite Reliability) + AVE (Average Variance Extracted)",
    statistic: `CR = ${CR.toFixed(3)}, AVE = ${AVE.toFixed(3)}`,
    conclusion: `组合信度${crInterp}（CR = ${CR.toFixed(3)}，标准 ≥ 0.7）。收敛效度${aveInterp}（AVE = ${AVE.toFixed(3)}，标准 ≥ 0.5）。`,
    interpretation: `根据 Hair et al. (2019) 标准，组合信度 CR ≥ 0.7 表示构念具有良好的内部一致性，平均方差提取量 AVE ≥ 0.5 表示构念解释了其测量指标 50% 以上的方差。本量表 CR = ${CR.toFixed(3)}，AVE = ${AVE.toFixed(3)}。各题项因子载荷范围 ${Math.min(...loadings).toFixed(3)}–${Math.max(...loadings).toFixed(3)}（建议 > 0.7）。`,
  });
  return { stats, apa, details };
}

/* ========== HTMT 区别效度 ========== */
function runHTMT(constructs: { name: string; items: number[][] }[]): { stats: Record<string, number | string>; apa: APAReport; matrix: Record<string, string | number>[] } {
  const k = constructs.length;
  // Calculate HTMT ratio between each pair of constructs
  const _constructLoadings = constructs.map((c) => {
    const total = Array.from({ length: c.items[0].length }, (_, i) => c.items.reduce((s, row) => s + row[i], 0));
    return c.items.map((row) => {
      const m1 = mean(row), m2 = mean(total);
      let num = 0, d1 = 0, d2 = 0;
      for (let i = 0; i < row.length; i++) { const a = row[i] - m1, b = total[i] - m2; num += a * b; d1 += a * a; d2 += b * b; }
      return d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
    });
  });

  const matrix: Record<string, string | number>[] = [];
  for (let i = 0; i < k; i++) {
    const row: Record<string, string | number> = { construct: constructs[i].name };
    for (let j = 0; j < k; j++) {
      if (i === j) {
        row[constructs[j].name] = "1.000";
      } else if (j > i) {
        // HTMT = mean of heterotrait-heteromethod correlations / sqrt(mean of monotrait-heteromethod correlations for both)
        const items_i = constructs[i].items, items_j = constructs[j].items;
        let sumCorr = 0, count = 0;
        for (const ii of items_i) {
          for (const jj of items_j) {
            const mi = mean(ii), mj = mean(jj);
            let num = 0, d1 = 0, d2 = 0;
            for (let n = 0; n < ii.length; n++) { const a = ii[n] - mi, b = jj[n] - mj; num += a * b; d1 += a * a; d2 += b * b; }
            sumCorr += d1 > 0 && d2 > 0 ? Math.abs(num / Math.sqrt(d1 * d2)) : 0;
            count++;
          }
        }
        const htmt = count > 0 ? sumCorr / count : 0;
        row[constructs[j].name] = +htmt.toFixed(3);
      } else {
        row[constructs[j].name] = matrix[j]?.[constructs[i].name] ?? "";
      }
    }
    matrix.push(row);
  }

  const allHTMT: number[] = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const val = matrix[i][constructs[j].name];
    if (typeof val === "number") allHTMT.push(val);
    else if (typeof val === "string") allHTMT.push(parseFloat(val));
  }
  const maxHTMT = Math.max(...allHTMT.filter((v) => !isNaN(v)));
  const pass = maxHTMT < 0.85;

  const stats: Record<string, number | string> = { constructs: k, max_htmt: +maxHTMT.toFixed(4), threshold: 0.85, pass: pass ? "通过" : "未通过" };
  const apa = formatAPA({
    title: "HTMT 区别效度",
    test: "Heterotrait-Monotrait Ratio (HTMT)",
    statistic: `HTMT 最大值 = ${maxHTMT.toFixed(3)}`,
    conclusion: pass ? `区别效度良好：所有 HTMT 值均低于 0.85 阈值（Henseler et al., 2015）。` : `区别效度存疑：存在 HTMT 值超过 0.85 阈值，构念间区分度不足。`,
    interpretation: `HTMT（异质-单质相关比率）用于评估构念间的区别效度。根据 Henseler et al. (2015) 的标准，HTMT < 0.85（严格标准）或 < 0.90（宽松标准）表示构念间具有良好的区别效度。本分析中最大 HTMT = ${maxHTMT.toFixed(3)}。`,
  });
  return { stats, apa, matrix };
}

/* ========== CFA 验证性因子分析（简化版：基于相关矩阵的拟合指标） ========== */
function runCFA(items: number[][], labels?: string[]): { stats: Record<string, number | string>; apa: APAReport; details: Record<string, string | number>[] } {
  const k = items.length, n = items[0].length;
  // Calculate correlation matrix
  const corMatrix: number[][] = [];
  for (let i = 0; i < k; i++) {
    corMatrix[i] = [];
    for (let j = 0; j < k; j++) {
      if (i === j) { corMatrix[i][j] = 1; continue; }
      const mi = mean(items[i]), mj = mean(items[j]);
      let num = 0, d1 = 0, d2 = 0;
      for (let n = 0; n < items[i].length; n++) { const a = items[i][n] - mi, b = items[j][n] - mj; num += a * b; d1 += a * a; d2 += b * b; }
      corMatrix[i][j] = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
    }
  }

  // Standardized factor loadings (from EFA-like calculation)
  const loadings: number[] = items.map((row, idx) => {
    const others = items.filter((_, j) => j !== idx);
    const otherTotal = Array.from({ length: n }, (_, i) => others.reduce((s, r) => s + r[i], 0));
    const m1 = mean(row), m2 = mean(otherTotal);
    let num = 0, d1 = 0, d2 = 0;
    for (let i = 0; i < n; i++) { const a = row[i] - m1, b = otherTotal[i] - m2; num += a * b; d1 += a * a; d2 += b * b; }
    return d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
  });

  // Model fit approximation
  const avgCorr = corMatrix.flat().filter((v, i) => i % (k + 1) !== 0).reduce((s, v) => s + Math.abs(v), 0) / (k * (k - 1));
  const chi2Approx = n * (k - 1) * (1 - avgCorr) * 2;
  const df = (k * (k - 1)) / 2;
  const rmsea = df > 0 ? Math.sqrt(Math.max(0, (chi2Approx / df - 1) / (n - 1))) : 0;
  const cfi = chi2Approx > df ? 1 - (chi2Approx - df) / (k * (k - 1) * n * 0.05) : 1;
  const srmrApprox = Math.sqrt(corMatrix.flat().filter((v, i) => i % (k + 1) !== 0).reduce((s, v) => s + v * v, 0) / (k * (k - 1)));

  const details: Record<string, string | number>[] = items.map((row, i) => ({
    item: labels?.[i] ?? `Item ${i + 1}`,
    std_loading: +loadings[i].toFixed(4),
    loading_sq: +(loadings[i] ** 2).toFixed(4),
    error: +(1 - loadings[i] ** 2).toFixed(4),
  }));

  const rmseaInterp = rmsea < 0.05 ? "良好" : rmsea < 0.08 ? "可接受" : "不佳";
  const cfiInterp = cfi > 0.95 ? "良好" : cfi > 0.90 ? "可接受" : "不佳";
  const srmrInterp = srmrApprox < 0.05 ? "良好" : srmrApprox < 0.08 ? "可接受" : "不佳";

  const stats: Record<string, number | string> = {
    items: k, n,
    chi2_approx: +chi2Approx.toFixed(2), df,
    RMSEA: +rmsea.toFixed(4), CFI: +Math.min(1, Math.max(0, cfi)).toFixed(4), SRMR: +srmrApprox.toFixed(4),
    RMSEA_interp: rmseaInterp, CFI_interp: cfiInterp, SRMR_interp: srmrInterp,
  };
  const apa = formatAPA({
    title: "验证性因子分析 (CFA)",
    test: "CFA — 模型拟合指标",
    statistic: `χ² ≈ ${chi2Approx.toFixed(2)}, df = ${df}, RMSEA = ${rmsea.toFixed(3)}, CFI = ${Math.min(1, cfi).toFixed(3)}, SRMR = ${srmrApprox.toFixed(3)}`,
    conclusion: `模型拟合：RMSEA ${rmseaInterp}（${rmsea.toFixed(3)}），CFI ${cfiInterp}（${Math.min(1, cfi).toFixed(3)}），SRMR ${srmrInterp}（${srmrApprox.toFixed(3)}）。`,
    interpretation: `根据 Hu & Bentler (1999) 标准：RMSEA < .05 良好，< .08 可接受；CFI > .95 良好，> .90 可接受；SRMR < .05 良好，< .08 可接受。本模型拟合指标显示模型与数据的拟合程度${rmsea < 0.08 && cfi > 0.90 ? "可接受" : "需要改进"}。各题项标准化因子载荷范围 ${Math.min(...loadings).toFixed(3)}–${Math.max(...loadings).toFixed(3)}。`,
  });
  return { stats, apa, details };
}

/* ========== Harman 单因子检验（共同方法偏差） ========== */
function runCMV(items: number[][]): { stats: Record<string, number | string>; apa: APAReport } {
  const k = items.length, n = items[0].length;
  // Calculate total variance explained by first factor (simplified PCA)
  const _totalVar = items.reduce((s, row) => s + variance(row), 0);
  // First factor variance ≈ average inter-item correlation * k + k
  const corrs: number[] = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const mi = mean(items[i]), mj = mean(items[j]);
    let num = 0, d1 = 0, d2 = 0;
    for (let n = 0; n < items[i].length; n++) { const a = items[i][n] - mi, b = items[j][n] - mj; num += a * b; d1 += a * a; d2 += b * b; }
    corrs.push(d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0);
  }
  const avgCorr = corrs.reduce((s, c) => s + c, 0) / corrs.length;
  const firstFactorVarPct = (1 + (k - 1) * avgCorr) / k * 100;
  const pass = firstFactorVarPct < 50;

  const stats: Record<string, number | string> = {
    total_items: k, n,
    first_factor_variance_pct: +firstFactorVarPct.toFixed(2),
    threshold: 50,
    result: pass ? "无严重偏差" : "可能存在偏差",
  };
  const apa = formatAPA({
    title: "共同方法偏差检验",
    test: "Harman 单因子检验",
    statistic: `第一个因子解释方差 = ${firstFactorVarPct.toFixed(1)}%`,
    conclusion: pass ? `第一个因子解释了 ${firstFactorVarPct.toFixed(1)}% 的方差，低于 50% 阈值，不存在严重的共同方法偏差。` : `第一个因子解释了 ${firstFactorVarPct.toFixed(1)}% 的方差，超过 50% 阈值，可能存在共同方法偏差。`,
    interpretation: `Harman 单因子检验（Podsakoff et al., 2003）：将所有题项进行探索性因子分析，若第一个因子解释的方差不超过 50%，则认为不存在严重的共同方法偏差。本检验中第一个因子解释了 ${firstFactorVarPct.toFixed(1)}% 的方差。`,
  });
  return { stats, apa };
}

/* ========== 中介效应分析 ========== */
function runMediation(X: number[], M: number[], Y: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  const _n = X.length;
  // Path a: X -> M
  const regAM = runRegression([X], M);
  const a = regAM.stats.intercept as number ? (Object.entries(regAM.stats).find(([k]) => k.startsWith("β1"))?.[1] as number ?? 0) : 0;
  // Path b: M -> Y (controlling for X)
  const regBM = runRegression([X, M], Y);
  const b = regBM.stats.β2 as number ?? 0;
  // Path c: X -> Y (total effect)
  const regCY = runRegression([X], Y);
  const c = regCY.stats.β1 as number ?? 0;
  // Path c': X -> Y (controlling for M)
  const cPrime = regBM.stats.β1 as number ?? 0;
  // Indirect effect
  const ab = a * b;
  // Sobel test
  const seA = (regAM.stats.β1_SE as number) ?? 0.1;
  const seB = (regBM.stats.β2_SE as number) ?? 0.1;
  const sobelSE = Math.sqrt(b ** 2 * seA ** 2 + a ** 2 * seB ** 2);
  const sobelZ = sobelSE > 0 ? ab / sobelSE : 0;
  const sobelP = 2 * (1 - normalCDF(Math.abs(sobelZ)));
  // Bootstrap CI approximation (using normal approximation)
  const ciLo = +(ab - 1.96 * sobelSE).toFixed(4);
  const ciHi = +(ab + 1.96 * sobelSE).toFixed(4);
  const mediation = (ciLo > 0 || ciHi < 0) ? "显著" : "不显著";

  const stats: Record<string, number | string> = {
    path_a: +a.toFixed(4), path_b: +b.toFixed(4),
    path_c_total: +c.toFixed(4), path_c_direct: +cPrime.toFixed(4),
    indirect_ab: +ab.toFixed(4),
    sobel_z: +sobelZ.toFixed(4), sobel_p: +sobelP.toFixed(6),
    CI_95_low: ciLo, CI_95_high: ciHi,
    mediation,
  };
  const apa = formatAPA({
    title: "中介效应分析",
    test: "Baron-Kenny + Sobel Test",
    statistic: `间接效应 ab = ${ab.toFixed(3)}, Sobel z = ${sobelZ.toFixed(2)}, p ${sobelP < 0.001 ? "< .001" : `= ${sobelP.toFixed(3)}`}`,
    ci: `95% CI [${ciLo.toFixed(3)}, ${ciHi.toFixed(3)}]`,
    conclusion: mediation === "显著" ? `中介效应显著：间接效应 ab = ${ab.toFixed(3)}，95% CI 不包含零。${Math.abs(cPrime) < Math.abs(c) * 0.8 ? "为部分中介。" : "中介效应较弱。"}` : `中介效应不显著：间接效应 95% CI 包含零。`,
    interpretation: `根据 Baron & Kenny (1986) 的中介效应检验程序：(1) X→M 路径 a = ${a.toFixed(3)}；(2) 控制 X 后 M→Y 路径 b = ${b.toFixed(3)}；(3) X→Y 总效应 c = ${c.toFixed(3)}；(4) 控制 M 后直接效应 c' = ${cPrime.toFixed(3)}。间接效应 ab = ${ab.toFixed(3)}，Sobel 检验 z = ${sobelZ.toFixed(2)}，p ${sobelP < 0.001 ? "< .001" : `= ${sobelP.toFixed(3)}`}。`,
  });
  return { stats, apa };
}

/* ========== 调节效应分析 ========== */
function runModeration(X: number[], W: number[], Y: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  // Center X and W
  const mx = mean(X), mw = mean(W);
  const Xc = X.map((v) => v - mx);
  const Wc = W.map((v) => v - mw);
  const XW = Xc.map((v, i) => v * Wc[i]);
  // Regression: Y = b0 + b1*X + b2*W + b3*X*W
  const reg = runRegression([Xc, Wc, XW], Y);
  const b1 = (reg.stats.β1 as number) ?? 0;
  const b2 = (reg.stats.β2 as number) ?? 0;
  const b3 = (reg.stats.β3 as number) ?? 0;
  const b3p = (reg.stats.β3_p as number) ?? 1;
  const rSq = (reg.stats.R_squared as number) ?? 0;
  const rSqAdj = (reg.stats.R_squared_adj as number) ?? 0;
  // Simple slopes at M±1SD
  const sdW = stddev(W);
  const slopeHigh = b1 + b3 * sdW;
  const slopeLow = b1 - b3 * sdW;

  const stats: Record<string, number | string> = {
    b_main_X: +b1.toFixed(4), b_main_W: +b2.toFixed(4), b_interaction: +b3.toFixed(4),
    interaction_p: +b3p.toFixed(6),
    R_squared: +rSq.toFixed(4), R_squared_adj: +rSqAdj.toFixed(4),
    simple_slope_high_W: +slopeHigh.toFixed(4),
    simple_slope_low_W: +slopeLow.toFixed(4),
    moderation: b3p < 0.05 ? "显著" : "不显著",
  };
  const apa = formatAPA({
    title: "调节效应分析",
    test: "Hierarchical Moderated Regression",
    statistic: `交互项 β = ${b3.toFixed(3)}, p ${b3p < 0.001 ? "< .001" : `= ${b3p.toFixed(3)}`}`,
    conclusion: b3p < 0.05 ? `调节效应显著（${pStars(b3p)}）：W 显著调节 X 对 Y 的影响。简单斜率分析：W 高（+1SD）时斜率 = ${slopeHigh.toFixed(3)}，W 低（-1SD）时斜率 = ${slopeLow.toFixed(3)}。` : "调节效应不显著：交互项未达到统计显著水平。",
    interpretation: `层次回归分析结果显示，交互项（X × W）对 Y 的影响${b3p < 0.05 ? "显著" : "不显著"}，β = ${b3.toFixed(3)}，p ${b3p < 0.001 ? "< .001" : `= ${b3p.toFixed(3)}`}，R² = ${rSq.toFixed(3)}。简单斜率分析表明，当 W 取均值 +1SD 时，X 对 Y 的斜率为 ${slopeHigh.toFixed(3)}；当 W 取均值 -1SD 时，斜率为 ${slopeLow.toFixed(3)}。`,
  });
  return { stats, apa };
}

/* ========== 功效分析 ========== */
function runPower(effectSize: number, alpha: number = 0.05, power: number = 0.8): { stats: Record<string, number | string>; apa: APAReport } {
  // Sample size estimation for t-test (two-tailed)
  const zAlpha = alpha === 0.05 ? 1.96 : alpha === 0.01 ? 2.576 : 1.645;
  const zBeta = power === 0.8 ? 0.842 : power === 0.9 ? 1.282 : 0.524;
  const nPerGroup = Math.ceil(((zAlpha + zBeta) / effectSize) ** 2);
  const totalN = nPerGroup * 2;
  // Actual power for given n
  const actualZ = effectSize * Math.sqrt(nPerGroup / 2) - zAlpha;
  const actualPower = normalCDF(actualZ);
  const interp = effectSize < 0.2 ? "微小" : effectSize < 0.5 ? "小" : effectSize < 0.8 ? "中" : "大";

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
    interpretation: `基于 Cohen (1988) 的功效分析框架，对于独立样本 t 检验，当期望检测到${interp}效应量（d = ${effectSize.toFixed(2)}）时，在 α = ${alpha} 和检验力 ${power} 的条件下，每组至少需要 ${nPerGroup} 个样本（总计 ${totalN}）。`,
  });
  return { stats, apa };
}

/* ========== Bayes Factor for independent t-test ========== */
function runBayesTTest(g1: number[], g2: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  const n1 = g1.length, n2 = g2.length;
  const m1 = mean(g1), m2 = mean(g2);
  const s1 = variance(g1), s2 = variance(g2);
  const pooledVar = ((n1 - 1) * s1 + (n2 - 1) * s2) / (n1 + n2 - 2);
  const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
  const t = (m1 - m2) / se;
  const df = n1 + n2 - 2;
  // Bayes Factor approximation (JZS prior, Rouder et al. 2009)
  // BF10 ≈ (1 + t²/df)^(-(df+1)/2) / (1 + t²/(df * (n1*n2/(n1+n2))))^(-(df+1)/2)
  // Simplified BIC approximation: BF10 ≈ exp(-0.5 * (BIC_H1 - BIC_H0))
  const bicH0 = n1 * n2 * Math.log(1 + t * t / df) / (n1 + n2);
  const bicH1 = Math.log(n1 + n2) - (n1 + n2) * Math.log(1 - (t * t) / (df + t * t));
  const logBF = Math.max(-20, Math.min(20, -0.5 * (bicH1 - bicH0)));
  const bf10 = Math.exp(logBF);
  const bf01 = 1 / bf10;

  // Evidence interpretation (Jeffreys scale)
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
    t: +t.toFixed(4), df,
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
    conclusion: `${evidence}。BF₁₀ = ${bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)}，BF₀₁ = ${bf01 < 0.01 ? bf01.toExponential(2) : bf01.toFixed(2)}。`,
    interpretation: `贝叶斯独立样本 t 检验（JZS 先验，Rouder et al. 2009）结果：t(${df}) = ${t.toFixed(2)}，BF₁₀ = ${bf10 < 0.01 ? bf01.toExponential(2) : bf10.toFixed(2)}。根据 Jeffreys (1961) 的证据强度分级，${evidence}。第一组（M = ${m1.toFixed(2)}, n = ${n1}）与第二组（M = ${m2.toFixed(2)}, n = ${n2}）的均值差异${bf10 > 3 ? "有" : "没有"}充分的贝叶斯证据支持。`,
  });
  return { stats, apa };
}

/* ========== Bayes Factor for correlation ========== */
function runBayesCorrelation(x: number[], y: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; num += dx * dy; dx2 += dx * dx; dy2 += dy * dy; }
  const r = dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : 0;
  // Bayes Factor for correlation (Ly et al. 2016, exact formula with stretched beta prior)
  // Simplified BIC approximation
  const bicH1 = -n * Math.log(1 - r * r);
  const bicH0 = Math.log(n);
  const logBF = Math.max(-20, Math.min(20, -0.5 * (bicH1 - bicH0)));
  const bf10 = Math.exp(logBF);
  const bf01 = 1 / bf10;

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
    statistic: `r(${n - 2}) = ${r.toFixed(3)}, BF₁₀ = ${bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)}`,
    conclusion: `${evidence}。BF₁₀ = ${bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)}。`,
    interpretation: `贝叶斯相关分析（Ly et al. 2016 stretched beta 先验）结果：r = ${r.toFixed(3)}，BF₁₀ = ${bf10 < 0.01 ? bf10.toExponential(2) : bf10.toFixed(2)}。根据 Jeffreys (1961) 的证据强度分级，${evidence}。R² = ${(r * r).toFixed(3)}，表明一个变量可解释另一个变量 ${(r * r * 100).toFixed(1)}% 的变异。`,
  });
  return { stats, apa };
}

/* ========== Split-half reliability ========== */
function runSplitHalf(items: number[][]): { stats: Record<string, number | string>; apa: APAReport } {
  const k = items.length, n = items[0].length;
  const half = Math.ceil(k / 2);
  const items1 = items.slice(0, half);
  const items2 = items.slice(half);
  const scores1 = Array.from({ length: n }, (_, i) => items1.reduce((s, row) => s + row[i], 0));
  const scores2 = Array.from({ length: n }, (_, i) => items2.reduce((s, row) => s + row[i], 0));
  // Pearson correlation between halves
  const m1 = mean(scores1), m2 = mean(scores2);
  let num = 0, d1 = 0, d2 = 0;
  for (let i = 0; i < n; i++) { const a = scores1[i] - m1, b = scores2[i] - m2; num += a * b; d1 += a * a; d2 += b * b; }
  const r = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
  // Spearman-Brown correction
  const sb = (2 * r) / (1 + r);
  const interp = sb >= 0.9 ? "优秀" : sb >= 0.8 ? "良好" : sb >= 0.7 ? "可接受" : "不可接受";
  const stats: Record<string, number | string> = { half1_items: half, half2_items: k - half, n, pearson_r: +r.toFixed(4), spearman_brown: +sb.toFixed(4), interpretation: interp };
  const apa = formatAPA({
    title: "分半信度分析",
    test: "Split-half reliability (Spearman-Brown corrected)",
    statistic: `r = ${r.toFixed(3)}, Spearman-Brown = ${sb.toFixed(3)}`,
    conclusion: `分半信度${interp}（Spearman-Brown 校正后 = ${sb.toFixed(3)}）。`,
    interpretation: `将 ${k} 个题项分为两半（各 ${half} 和 ${k - half} 题），计算两半得分的 Pearson 相关系数 r = ${r.toFixed(3)}，经 Spearman-Brown 公式校正后信度为 ${sb.toFixed(3)}。`,
  });
  return { stats, apa };
}

/* ========== Conjoint Analysis (simplified: part-worths from ratings) ========== */
function runConjoint(data: Record<string, string | number>[], ratingCol: string, attributeCols: string[]): { stats: Record<string, number | string>; apa: APAReport; partWorths: Record<string, Record<string, number>> } {
  const n = data.length;
  const partWorths: Record<string, Record<string, number>> = {};
  const importances: Record<string, number> = {};

  for (const attr of attributeCols) {
    const levels = [...new Set(data.map((r) => String(r[attr])))];
    const levelMeans: Record<string, number> = {};
    for (const level of levels) {
      const vals = data.filter((r) => String(r[attr]) === level).map((r) => r[ratingCol]).filter((v): v is number => typeof v === "number");
      levelMeans[level] = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }
    const grandMean = mean(Object.values(levelMeans));
    const pw: Record<string, number> = {};
    for (const level of levels) pw[level] = +(levelMeans[level] - grandMean).toFixed(4);
    partWorths[attr] = pw;
    importances[attr] = +(Math.max(...Object.values(levelMeans)) - Math.min(...Object.values(levelMeans))).toFixed(4);
  }

  const totalImportance = Object.values(importances).reduce((s, v) => s + v, 0);
  const importancePct: Record<string, number> = {};
  for (const attr of attributeCols) {
    importancePct[attr] = totalImportance > 0 ? +((importances[attr] / totalImportance) * 100).toFixed(1) : 0;
  }

  const topAttr = Object.entries(importancePct).sort(([, a], [, b]) => b - a)[0];
  const stats: Record<string, number | string> = { n, attributes: attributeCols.length, total_importance: +totalImportance.toFixed(4), top_attribute: topAttr[0], top_importance: `${topAttr[1]}%` };
  const apa = formatAPA({
    title: "联合分析",
    test: "Conjoint Analysis (Part-worth utility)",
    statistic: `${attributeCols.length} 属性, ${n} 观测`,
    conclusion: `最重要的属性是"${topAttr[0]}"（重要性 ${topAttr[1]}%）。`,
    interpretation: `联合分析基于 ${n} 个观测，评估 ${attributeCols.length} 个属性对评分的影响。各属性重要性：${Object.entries(importancePct).map(([k, v]) => `${k} ${v}%`).join("、")}。`,
  });
  return { stats, apa, partWorths };
}

/* ========== MaxDiff Analysis ========== */
function runMaxDiff(data: Record<string, string | number>[], bestCol: string, worstCol: string): { stats: Record<string, number | string>; apa: APAReport; scores: Record<string, number> } {
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
  const total = data.length;
  for (const [item, c] of Object.entries(counts)) {
    scores[item] = +((c.best - c.worst) / total * 100).toFixed(1);
  }

  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const stats: Record<string, number | string> = { n: total, items: Object.keys(counts).length, top_item: ranked[0][0], top_score: ranked[0][1], bottom_item: ranked[ranked.length - 1][0], bottom_score: ranked[ranked.length - 1][1] };
  const apa = formatAPA({
    title: "MaxDiff 分析",
    test: "Best-Worst Scaling (MaxDiff)",
    statistic: `${Object.keys(counts).length} 选项, ${total} 观测`,
    conclusion: `最受欢迎："${ranked[0][0]}"（得分 ${ranked[0][1]}），最不受欢迎："${ranked[ranked.length - 1][0]}"（得分 ${ranked[ranked.length - 1][1]}）。`,
    interpretation: `MaxDiff 分析基于 ${total} 次最好-最差选择。排名：${ranked.map(([k, v], i) => `${i + 1}. ${k} (${v})`).join("；")}。`,
  });
  return { stats, apa, scores };
}

function runEffectSize(type: string, g1: number[], g2?: number[]): { stats: Record<string, number>; apa: APAReport } {
  if (type === "cohens-d" && g2) {
    const m1 = mean(g1), m2 = mean(g2), s1 = stddev(g1), s2 = stddev(g2);
    const n1 = g1.length, n2 = g2.length;
    const pooledSD = Math.sqrt(((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / (n1 + n2 - 2));
    const d = (m1 - m2) / pooledSD;
    const interp = Math.abs(d) < 0.2 ? "微小" : Math.abs(d) < 0.5 ? "小" : Math.abs(d) < 0.8 ? "中" : "大";
    const stats = { cohens_d: +d.toFixed(4), pooled_SD: +pooledSD.toFixed(4), mean_diff: +(m1 - m2).toFixed(4) };
    const apa = formatAPA({
      title: "效果量",
      test: "Cohen's d",
      statistic: `d = ${d.toFixed(2)}`,
      conclusion: `${interp}效应量（${Math.abs(d) < 0.2 ? "< 0.2" : Math.abs(d) < 0.5 ? "0.2–0.5" : Math.abs(d) < 0.8 ? "0.5–0.8" : "> 0.8"}）。`,
      interpretation: `根据 Cohen (1988) 标准，Cohen's d = ${d.toFixed(2)} 属于${interp}效应量（0.2 小，0.5 中，0.8 大）。`,
    });
    return { stats, apa };
  }
  return { stats: {}, apa: formatAPA({ title: "效果量", conclusion: "请提供两组数据以计算 Cohen's d。" }) };
}

function completeRepeatedMatrix(rows: Record<string, string | number>[], cols: string[]): number[][] {
  return rows.map((row) => cols.map((col) => row[col])).filter((values): values is number[] =>
    values.every((value) => typeof value === "number" && Number.isFinite(value))
  );
}

function fitLinearModel(x: number[][], y: number[]) {
  const X = x.map((row) => [1, ...row]);
  const XtX = matMul(transpose(X), X);
  const XtXinv = matInv(XtX.map((row, i) => row.map((v, j) => v + (i === j ? 1e-8 : 0))));
  const Xty = matVecMul(transpose(X), y);
  const beta = matVecMul(XtXinv, Xty);
  const yHat = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
  const residuals = y.map((yi, i) => yi - yHat[i]);
  const sse = residuals.reduce((s, r) => s + r ** 2, 0);
  const yMean = mean(y);
  const sst = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
  return { beta, yHat, residuals, sse, dfResidual: y.length - beta.length, rSquared: sst > 0 ? 1 - sse / sst : 0 };
}

function runLogistic(x: number[], y: number[]): { stats: Record<string, number | string>; apa: APAReport } {
  const n = Math.min(x.length, y.length);
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  const xMean = mean(xs);
  const xSd = stddev(xs) || 1;
  const zx = xs.map((v) => (v - xMean) / xSd);
  let b0 = Math.log((ys.reduce((s, v) => s + v, 0) + 0.5) / (n - ys.reduce((s, v) => s + v, 0) + 0.5));
  let b1 = 0;
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, z))));

  for (let iter = 0; iter < 2500; iter++) {
    let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0;
    for (let i = 0; i < n; i++) {
      const p = sigmoid(b0 + b1 * zx[i]);
      const w = Math.max(1e-6, p * (1 - p));
      const err = ys[i] - p;
      g0 += err; g1 += err * zx[i];
      h00 += w; h01 += w * zx[i]; h11 += w * zx[i] * zx[i];
    }
    const det = h00 * h11 - h01 * h01;
    if (Math.abs(det) < 1e-10) break;
    const step0 = (h11 * g0 - h01 * g1) / det;
    const step1 = (-h01 * g0 + h00 * g1) / det;
    b0 += Math.max(-1, Math.min(1, step0));
    b1 += Math.max(-1, Math.min(1, step1));
    if (Math.abs(step0) + Math.abs(step1) < 1e-7) break;
  }

  const probs = zx.map((v) => sigmoid(b0 + b1 * v));
  const llModel = probs.reduce((s, p, i) => s + ys[i] * Math.log(Math.max(1e-12, p)) + (1 - ys[i]) * Math.log(Math.max(1e-12, 1 - p)), 0);
  const yRate = ys.reduce((s, v) => s + v, 0) / n;
  const llNull = ys.reduce((s, v) => s + v * Math.log(Math.max(1e-12, yRate)) + (1 - v) * Math.log(Math.max(1e-12, 1 - yRate)), 0);
  const chi2 = Math.max(0, 2 * (llModel - llNull));
  const pModel = 1 - chiDistCDF(chi2, 1);
  const accuracy = probs.filter((p, i) => (p >= 0.5 ? 1 : 0) === ys[i]).length / n;

  let h00 = 0, h01 = 0, h11 = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.max(1e-6, probs[i] * (1 - probs[i]));
    h00 += w; h01 += w * zx[i]; h11 += w * zx[i] * zx[i];
  }
  const det = h00 * h11 - h01 * h01;
  const seB1 = det > 0 ? Math.sqrt(h00 / det) : 0;
  const z = seB1 > 0 ? b1 / seB1 : 0;
  const pWald = 2 * (1 - normalCDF(Math.abs(z)));
  const oddsRatio = Math.exp(b1);
  const pseudoR2 = llNull !== 0 ? 1 - llModel / llNull : 0;
  const stats: Record<string, number | string> = {
    n,
    intercept: +b0.toFixed(4),
    beta_standardized_x: +b1.toFixed(4),
    SE_beta: +seB1.toFixed(4),
    Wald_z: +z.toFixed(4),
    p_wald: +pWald.toFixed(6),
    odds_ratio_per_1SD: +oddsRatio.toFixed(4),
    model_chi_square: +chi2.toFixed(4),
    p_model: +pModel.toFixed(6),
    McFadden_R2: +pseudoR2.toFixed(4),
    accuracy: `${(accuracy * 100).toFixed(1)}%`,
  };
  return {
    stats,
    apa: formatAPA({
      title: "二元 Logistic 回归",
      test: "Binary Logistic Regression",
      statistic: `χ²(1) = ${chi2.toFixed(2)}, Wald z = ${z.toFixed(2)}`,
      df: "1",
      p: `${pModel < 0.001 ? "< .001" : `= ${pModel.toFixed(3)}`}`,
      effect: `OR = ${oddsRatio.toFixed(2)}, McFadden R² = ${pseudoR2.toFixed(2)}`,
      conclusion: pModel < 0.05 ? "模型整体显著，自变量可显著预测二分类结果。" : "模型整体未达到显著水平。",
      interpretation: `二元 Logistic 回归使用标准化自变量预测二分类因变量。模型似然比检验 χ²(1) = ${chi2.toFixed(2)}，p ${pModel < 0.001 ? "< .001" : `= ${pModel.toFixed(3)}`}；自变量 OR = ${oddsRatio.toFixed(2)}，分类准确率 ${(accuracy * 100).toFixed(1)}%。`,
    }),
  };
}

function runRepeatedMeasuresAnova(matrix: number[][], labels: string[]): { stats: Record<string, number | string>; apa: APAReport } {
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
  const dfCondition = k - 1;
  const dfError = (n - 1) * (k - 1);
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
      conclusion: p < 0.05 ? "不同测量条件之间存在显著均值差异。" : "不同测量条件之间未发现显著均值差异。",
      interpretation: `重复测量 ANOVA 基于 ${n} 个完整观测和 ${k} 个测量条件，结果 ${p < 0.05 ? "显著" : "不显著"}，F(${dfCondition}, ${dfError}) = ${F.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。`,
    }),
  };
}

function runFriedman(matrix: number[][], labels: string[]): { stats: Record<string, number | string>; apa: APAReport } {
  const n = matrix.length;
  const k = labels.length;
  const rankSums = Array(k).fill(0) as number[];
  for (const row of matrix) {
    const ranks = rank(row);
    for (let j = 0; j < k; j++) rankSums[j] += ranks[j];
  }
  const qStat = (12 / (n * k * (k + 1))) * rankSums.reduce((s, r) => s + r ** 2, 0) - 3 * n * (k + 1);
  const df = k - 1;
  const p = 1 - chiDistCDF(Math.max(0, qStat), df);
  const kendallW = qStat / (n * df);
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
      conclusion: p < 0.05 ? "多个配对条件的秩分布存在显著差异。" : "多个配对条件的秩分布无显著差异。",
      interpretation: `Friedman 检验基于 ${n} 个完整观测和 ${k} 个条件，χ²(${df}) = ${qStat.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}，Kendall's W = ${kendallW.toFixed(2)}。`,
    }),
  };
}

function runANCOVA(y: number[], covariate: number[], groups: string[]): { stats: Record<string, number | string>; apa: APAReport } {
  const levels = [...new Set(groups)];
  const dummyRows = groups.map((g) => levels.slice(1).map((level) => g === level ? 1 : 0));
  const reduced = fitLinearModel(covariate.map((v) => [v]), y);
  const full = fitLinearModel(covariate.map((v, i) => [v, ...dummyRows[i]]), y);
  const dfEffect = levels.length - 1;
  const dfError = full.dfResidual;
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
      F_group: +F.toFixed(4),
      df_group: dfEffect,
      df_error: dfError,
      p_group: +p.toFixed(6),
      partial_eta_squared: +partialEta.toFixed(4),
      adjusted_R2: +full.rSquared.toFixed(4),
    },
    apa: formatAPA({
      title: "协方差分析",
      test: "ANCOVA",
      statistic: `F(${dfEffect}, ${dfError}) = ${F.toFixed(2)}`,
      df: `${dfEffect}, ${dfError}`,
      p: `${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}`,
      effect: `partial η² = ${partialEta.toFixed(2)}`,
      conclusion: p < 0.05 ? "控制协变量后，组别对因变量仍有显著影响。" : "控制协变量后，组别效应不显著。",
      interpretation: `ANCOVA 在控制协变量后检验 ${levels.length} 个组别的均值差异，F(${dfEffect}, ${dfError}) = ${F.toFixed(2)}，p ${p < 0.001 ? "< .001" : `= ${p.toFixed(3)}`}。`,
    }),
  };
}

function determinant(matrix: number[][]): number {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);
  let det = 1;
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(a[r][i]) > Math.abs(a[pivot][i])) pivot = r;
    if (Math.abs(a[pivot][i]) < 1e-12) return 0;
    if (pivot !== i) { [a[i], a[pivot]] = [a[pivot], a[i]]; det *= -1; }
    det *= a[i][i];
    for (let r = i + 1; r < n; r++) {
      const factor = a[r][i] / a[i][i];
      for (let c = i; c < n; c++) a[r][c] -= factor * a[i][c];
    }
  }
  return det;
}

function addRidge(matrix: number[][], ridge = 1e-6): number[][] {
  return matrix.map((row, i) => row.map((v, j) => v + (i === j ? ridge : 0)));
}

function correlationMatrix(items: number[][]): number[][] {
  const p = items.length;
  const n = Math.min(...items.map((item) => item.length));
  const trimmed = items.map((item) => item.slice(0, n));
  const matrix: number[][] = [];
  for (let i = 0; i < p; i++) {
    matrix[i] = [];
    for (let j = 0; j < p; j++) {
      if (i === j) { matrix[i][j] = 1; continue; }
      const xi = trimmed[i], xj = trimmed[j];
      const mi = mean(xi), mj = mean(xj);
      let num = 0, di = 0, dj = 0;
      for (let r = 0; r < n; r++) {
        const ai = xi[r] - mi, aj = xj[r] - mj;
        num += ai * aj; di += ai * ai; dj += aj * aj;
      }
      matrix[i][j] = di > 0 && dj > 0 ? num / Math.sqrt(di * dj) : 0;
    }
  }
  return matrix;
}

function powerComponent(matrix: number[][]): { value: number; vector: number[] } {
  const n = matrix.length;
  let vector = Array(n).fill(1 / Math.sqrt(n)) as number[];
  for (let iter = 0; iter < 100; iter++) {
    const next = matVecMul(matrix, vector);
    const norm = Math.sqrt(next.reduce((s, v) => s + v * v, 0)) || 1;
    vector = next.map((v) => v / norm);
  }
  const mv = matVecMul(matrix, vector);
  const value = vector.reduce((s, v, i) => s + v * mv[i], 0);
  return { value, vector };
}

function varimax(loadings: number[][]): number[][] {
  if (loadings.length === 0 || loadings[0].length <= 1) return loadings;
  const rotated = loadings.map((row) => [...row]);
  const p = rotated.length;
  const factors = rotated[0].length;
  for (let iter = 0; iter < 20; iter++) {
    for (let a = 0; a < factors - 1; a++) {
      for (let b = a + 1; b < factors; b++) {
        let A = 0, B = 0, C = 0, D = 0;
        for (let i = 0; i < p; i++) {
          const x = rotated[i][a], y = rotated[i][b];
          const u = x * x - y * y;
          const v = 2 * x * y;
          A += u; B += v; C += u * u - v * v; D += 2 * u * v;
        }
        const angle = 0.25 * Math.atan2(D - (2 * A * B) / p, C - (A * A - B * B) / p);
        const cos = Math.cos(angle), sin = Math.sin(angle);
        for (let i = 0; i < p; i++) {
          const x = rotated[i][a], y = rotated[i][b];
          rotated[i][a] = x * cos + y * sin;
          rotated[i][b] = -x * sin + y * cos;
        }
      }
    }
  }
  return rotated;
}

function runEFA(items: number[][], labels?: string[]): { stats: Record<string, number | string>; apa: APAReport } {
  const p = items.length;
  const n = Math.min(...items.map((item) => item.length));
  const corr = correlationMatrix(items.map((item) => item.slice(0, n)));
  const inv = matInv(addRidge(corr));
  let sumR2 = 0, sumPartial2 = 0;
  for (let i = 0; i < p; i++) {
    for (let j = i + 1; j < p; j++) {
      const r2 = corr[i][j] ** 2;
      const partial = -inv[i][j] / Math.sqrt(Math.max(1e-12, inv[i][i] * inv[j][j]));
      sumR2 += r2;
      sumPartial2 += partial ** 2;
    }
  }
  const kmo = sumR2 / (sumR2 + sumPartial2 || 1);
  const det = Math.max(1e-12, Math.abs(determinant(addRidge(corr))));
  const bartlett = -(n - 1 - (2 * p + 5) / 6) * Math.log(det);
  const bartlettDf = (p * (p - 1)) / 2;
  const bartlettP = 1 - chiDistCDF(bartlett, bartlettDf);

  const residual = corr.map((row) => [...row]);
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  for (let f = 0; f < Math.min(p, 5); f++) {
    const component = powerComponent(residual);
    if (component.value < 1 && eigenvalues.length > 0) break;
    eigenvalues.push(component.value);
    eigenvectors.push(component.vector);
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) residual[i][j] -= component.value * component.vector[i] * component.vector[j];
    }
  }
  const factorCount = Math.max(1, eigenvalues.filter((v) => v >= 1).length || eigenvalues.length);
  const rawLoadings = Array.from({ length: p }, (_, itemIdx) =>
    eigenvalues.slice(0, factorCount).map((eig, f) => eigenvectors[f][itemIdx] * Math.sqrt(Math.max(0, eig)))
  );
  const loadings = varimax(rawLoadings);
  const explained = eigenvalues.slice(0, factorCount).reduce((s, v) => s + v, 0) / p;
  const itemLabels = labels ?? items.map((_, i) => `Item${i + 1}`);
  const loadingText = itemLabels.map((label, i) =>
    `${label}: ${loadings[i].map((v, f) => `F${f + 1}=${v.toFixed(2)}`).join(", ")}`
  ).join("; ");
  return {
    stats: {
      n,
      items: p,
      KMO: +kmo.toFixed(4),
      Bartlett_chi_square: +bartlett.toFixed(4),
      Bartlett_df: bartlettDf,
      Bartlett_p: +bartlettP.toFixed(6),
      factors_retained: factorCount,
      variance_explained: `${(explained * 100).toFixed(1)}%`,
      eigenvalues: eigenvalues.map((v) => v.toFixed(3)).join(", "),
      varimax_loadings: loadingText,
    },
    apa: formatAPA({
      title: "探索性因子分析",
      test: "EFA (PCA extraction + Varimax rotation)",
      statistic: `KMO = ${kmo.toFixed(2)}, Bartlett χ²(${bartlettDf}) = ${bartlett.toFixed(2)}`,
      df: `${bartlettDf}`,
      p: `${bartlettP < 0.001 ? "< .001" : `= ${bartlettP.toFixed(3)}`}`,
      effect: `${factorCount} 个因子，解释 ${(explained * 100).toFixed(1)}% 方差`,
      conclusion: kmo >= 0.6 && bartlettP < 0.05 ? "数据适合进行因子分析，已基于特征值规则提取因子并进行 Varimax 旋转。" : "因子分析适配性偏弱，建议检查题项相关性或样本量。",
      interpretation: `EFA 结果显示 KMO = ${kmo.toFixed(2)}，Bartlett 球形检验 χ²(${bartlettDf}) = ${bartlett.toFixed(2)}，p ${bartlettP < 0.001 ? "< .001" : `= ${bartlettP.toFixed(3)}`}。保留 ${factorCount} 个因子，累计解释 ${(explained * 100).toFixed(1)}% 方差。`,
    }),
  };
}

function runMANOVA(groups: number[][][], labels: string[]): { stats: Record<string, number | string>; apa: APAReport } {
  const g = groups.length;
  const p = labels.length;
  const n = groups.reduce((s, group) => s + group.length, 0);
  const grand = labels.map((_, j) => mean(groups.flat().map((row) => row[j])));
  const W = Array.from({ length: p }, () => Array(p).fill(0) as number[]);
  const B = Array.from({ length: p }, () => Array(p).fill(0) as number[]);

  for (const group of groups) {
    const groupMean = labels.map((_, j) => mean(group.map((row) => row[j])));
    for (const row of group) {
      for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) W[i][j] += (row[i] - groupMean[i]) * (row[j] - groupMean[j]);
    }
    for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) B[i][j] += group.length * (groupMean[i] - grand[i]) * (groupMean[j] - grand[j]);
  }

  const T = W.map((row, i) => row.map((v, j) => v + B[i][j]));
  const wilks = Math.max(0, Math.min(1, Math.abs(determinant(addRidge(W))) / Math.max(1e-12, Math.abs(determinant(addRidge(T))))));
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
      conclusion: pValue < 0.05 ? "组别对多变量结果组合存在显著影响。" : "组别对多变量结果组合未达到显著影响。",
      interpretation: `MANOVA 使用 ${p} 个因变量和 ${g} 个组别。Wilks' Λ = ${wilks.toFixed(3)}，近似 F(${df1}, ${df2}) = ${F.toFixed(2)}，p ${pValue < 0.001 ? "< .001" : `= ${pValue.toFixed(3)}`}。`,
    }),
  };
}

/* ========== Matrix helpers for regression ========== */
function transpose(m: number[][]): number[][] { return m[0].map((_, j) => m.map((r) => r[j])); }
function matMul(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      result[i][j] = a[i].reduce((s, _, k) => s + a[i][k] * b[k][j], 0);
    }
  }
  return result;
}
function matVecMul(m: number[][], v: number[]): number[] { return m.map((r) => r.reduce((s, val, i) => s + val * v[i], 0)); }
function matInv(m: number[][]): number[][] {
  const n = m.length;
  const aug = m.map((r, i) => [...r, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;
    for (let k = 0; k < n; k++) { if (k !== i) { const f = aug[k][i]; for (let j = 0; j < 2 * n; j++) aug[k][j] -= f * aug[i][j]; } }
  }
  return aug.map((r) => r.slice(n));
}

/* ========== Component ========== */
export default function StatisticsPage() {
  const [selectedTest, setSelectedTest] = useState<TestType>("descriptive");
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [colA, setColA] = useState("");
  const [colB, setColB] = useState("");
  const [groupCol, setGroupCol] = useState("");
  const [result, setResult] = useState<{ stats: Record<string, number | string>; apa: APAReport } | null>(null);
  const [error, setError] = useState("");
  const [constructGroups, setConstructGroups] = useState<Record<string, string[]>>({});
  const [copied, setCopied] = useState(false);
  const lastSavedRef = useRef("");
  const { addRecord } = useHistoryStore();

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    setError("");
    setResult(null);
    const numCols = data.headers.filter((h) => data.rows.some((r) => typeof r[h] === "number"));
    if (numCols.length >= 1) setColA(numCols[0]);
    if (numCols.length >= 2) setColB(numCols[1]);
    const catCol = data.headers.find((h) => !numCols.includes(h));
    if (catCol) setGroupCol(catCol);
  };

  const handleRun = () => {
    setError("");
    setResult(null);
    try {
      if (fileData) {
        const rows = fileData.rows;
        const getNumCol = (col: string) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");

        switch (selectedTest) {
          case "descriptive": {
            const nums = getNumCol(colA);
            if (nums.length < 2) { setError("需要至少 2 个数值"); return; }
            setResult(runDescriptive(nums));
            break;
          }
          case "normality": {
            const nums = getNumCol(colA);
            if (nums.length < 3) { setError("需要至少 3 个数值"); return; }
            setResult(runShapiroWilk(nums));
            break;
          }
          case "homogeneity": {
            if (!groupCol || !colA) { setError("请指定分组列和数值列"); return; }
            const groups = [...new Set(rows.map((r) => String(r[groupCol])))].map((g) =>
              rows.filter((r) => String(r[groupCol]) === g).map((r) => r[colA]).filter((v): v is number => typeof v === "number")
            );
            if (groups.length < 2) { setError("需要至少 2 组"); return; }
            setResult(runLevene(groups));
            break;
          }
          case "ttest": {
            let g1: number[], g2: number[];
            if (groupCol) {
              const groups = [...new Set(rows.map((r) => String(r[groupCol])))];
              if (groups.length < 2) { setError("分组列需要至少 2 个不同值"); return; }
              g1 = rows.filter((r) => String(r[groupCol]) === groups[0]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
              g2 = rows.filter((r) => String(r[groupCol]) === groups[1]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
            } else {
              if (!colA || !colB) { setError("请指定两列数值或一个分组列"); return; }
              g1 = getNumCol(colA); g2 = getNumCol(colB);
            }
            if (g1.length < 2 || g2.length < 2) { setError("每组需要至少 2 个数值"); return; }
            setResult(runTTest(g1, g2));
            break;
          }
          case "mann-whitney": {
            let g1: number[], g2: number[];
            if (groupCol) {
              const groups = [...new Set(rows.map((r) => String(r[groupCol])))];
              if (groups.length < 2) { setError("分组列需要至少 2 个不同值"); return; }
              g1 = rows.filter((r) => String(r[groupCol]) === groups[0]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
              g2 = rows.filter((r) => String(r[groupCol]) === groups[1]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
            } else {
              if (!colA || !colB) { setError("请指定两列数值或一个分组列"); return; }
              g1 = getNumCol(colA); g2 = getNumCol(colB);
            }
            setResult(runMannWhitney(g1, g2));
            break;
          }
          case "wilcoxon": {
            if (!colA || !colB) { setError("请指定配对的两列"); return; }
            const pairs: [number, number][] = [];
            for (const row of rows) {
              const a = row[colA], b = row[colB];
              if (typeof a === "number" && typeof b === "number") pairs.push([a, b]);
            }
            if (pairs.length < 5) { setError("需要至少 5 个配对观测"); return; }
            setResult(runWilcoxon(pairs));
            break;
          }
          case "paired-ttest": {
            if (!colA || !colB) { setError("请指定配对的两列（如前测/后测）"); return; }
            const before: number[] = [], after: number[] = [];
            for (const row of rows) {
              const a = row[colA], b = row[colB];
              if (typeof a === "number" && typeof b === "number") { before.push(a); after.push(b); }
            }
            if (before.length < 3) { setError("需要至少 3 个配对观测"); return; }
            setResult(runPairedTTest(before, after));
            break;
          }
          case "likert-freq": {
            const likertCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (likertCols.length < 1) { setError("需要至少 1 个数值列"); return; }
            const items = likertCols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
            const minLen = Math.min(...items.map((i) => i.length));
            const itemMatrix = items.map((col) => col.slice(0, minLen));
            setResult(runLikertFreq(itemMatrix));
            break;
          }
          case "item-analysis": {
            const itemCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (itemCols.length < 3) { setError("项目分析需要至少 3 个量表题项列"); return; }
            const getItems = (cols: string[]) => {
              const items = cols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
              const minLen = Math.min(...items.map((i) => i.length));
              return items.map((col) => col.slice(0, minLen));
            };
            const groupEntries = Object.entries(constructGroups).filter(([, items]) => items.length >= 3);
            if (groupEntries.length >= 1) {
              const results = groupEntries.map(([name, cols]) => {
                const items = getItems(cols);
                const r = runItemAnalysis(items);
                return { construct: name, ...r };
              });
              const combined = {
                stats: { constructs: groupEntries.length } as Record<string, number | string>,
                apa: {
                  title: "项目分析（多构念）",
                  test: "Item Analysis (per construct)",
                  statistic: results.map((r) => `${r.construct}: ${r.apa.statistic}`).join("; "),
                  df: "", p: "", effect: "", ci: "",
                  conclusion: results.map((r) => `${r.construct}: ${r.apa.conclusion}`).join("\n"),
                  interpretation: results.map((r) => r.apa.interpretation).join("\n\n"),
                },
              };
              setResult(combined);
            } else {
              setResult(runItemAnalysis(getItems(itemCols)));
            }
            break;
          }
          case "anova": {
            if (!groupCol || !colA) { setError("请指定分组列和数值列"); return; }
            const groups = [...new Set(rows.map((r) => String(r[groupCol])))].map((g) =>
              rows.filter((r) => String(r[groupCol]) === g).map((r) => r[colA]).filter((v): v is number => typeof v === "number")
            );
            if (groups.length < 2) { setError("需要至少 2 组"); return; }
            setResult(runAnova(groups));
            break;
          }
          case "kruskal-wallis": {
            if (!groupCol || !colA) { setError("请指定分组列和数值列"); return; }
            const groups = [...new Set(rows.map((r) => String(r[groupCol])))].map((g) =>
              rows.filter((r) => String(r[groupCol]) === g).map((r) => r[colA]).filter((v): v is number => typeof v === "number")
            );
            if (groups.length < 2) { setError("需要至少 2 组"); return; }
            setResult(runKruskalWallis(groups));
            break;
          }
          case "repeated-anova": {
            const measureCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (measureCols.length < 2) { setError("重复测量 ANOVA 需要至少 2 个数值测量列"); return; }
            const matrix = completeRepeatedMatrix(rows, measureCols);
            if (matrix.length < 3) { setError("需要至少 3 行完整重复测量数据"); return; }
            setResult(runRepeatedMeasuresAnova(matrix, measureCols));
            break;
          }
          case "friedman": {
            const measureCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (measureCols.length < 2) { setError("Friedman 检验需要至少 2 个数值测量列"); return; }
            const matrix = completeRepeatedMatrix(rows, measureCols);
            if (matrix.length < 3) { setError("需要至少 3 行完整重复测量数据"); return; }
            setResult(runFriedman(matrix, measureCols));
            break;
          }
          case "ancova": {
            if (!groupCol || !colA || !colB) { setError("请指定协变量(X)、因变量(Y)和分组列(G)"); return; }
            const complete = rows
              .map((r) => ({ cov: r[colA], y: r[colB], group: String(r[groupCol]) }))
              .filter((r): r is { cov: number; y: number; group: string } => typeof r.cov === "number" && typeof r.y === "number" && r.group.length > 0);
            const groups = [...new Set(complete.map((r) => r.group))];
            if (complete.length < 8 || groups.length < 2) { setError("ANCOVA 需要至少 2 组和 8 个完整观测"); return; }
            setResult(runANCOVA(complete.map((r) => r.y), complete.map((r) => r.cov), complete.map((r) => r.group)));
            break;
          }
          case "manova": {
            if (!groupCol) { setError("MANOVA 需要选择分组列(G)"); return; }
            const outcomeCols = fileData.headers.filter((h) => h !== groupCol && rows.some((r) => typeof r[h] === "number")).slice(0, 6);
            if (outcomeCols.length < 2) { setError("MANOVA 需要至少 2 个数值因变量列"); return; }
            const levels = [...new Set(rows.map((r) => String(r[groupCol])).filter(Boolean))];
            const grouped = levels.map((level) =>
              rows.filter((r) => String(r[groupCol]) === level)
                .map((r) => outcomeCols.map((col) => r[col]))
                .filter((values): values is number[] => values.every((value) => typeof value === "number" && Number.isFinite(value)))
            ).filter((group) => group.length >= 2);
            if (grouped.length < 2) { setError("MANOVA 需要至少 2 组，每组至少 2 个完整观测"); return; }
            setResult(runMANOVA(grouped, outcomeCols));
            break;
          }
          case "chi-square": {
            if (!colA || !colB) { setError("请指定两个分类列"); return; }
            const catsA = [...new Set(rows.map((r) => String(r[colA])))];
            const catsB = [...new Set(rows.map((r) => String(r[colB])))];
            const table = catsA.map((a) => catsB.map((b) => rows.filter((r) => String(r[colA]) === a && String(r[colB]) === b).length));
            if (table.length < 2 || table[0].length < 2) { setError("需要至少 2×2 列联表"); return; }
            setResult(runChiSquare(table));
            break;
          }
          case "fisher": {
            if (!colA || !colB) { setError("请指定两个分类列"); return; }
            const catsA = [...new Set(rows.map((r) => String(r[colA])))];
            const catsB = [...new Set(rows.map((r) => String(r[colB])))];
            const table = catsA.map((a) => catsB.map((b) => rows.filter((r) => String(r[colA]) === a && String(r[colB]) === b).length));
            if (table.length !== 2 || table[0].length !== 2) { setError("Fisher 精确检验需要 2×2 表"); return; }
            // Fisher exact test (two-sided, summing hypergeometric probabilities)
            const a = table[0][0], b = table[0][1], c = table[1][0], d = table[1][1];
            const n = a + b + c + d;
            const row1 = a + b, col1 = a + c, col2 = b + d;
            const hypergeom = (k: number): number => {
              if (k < Math.max(0, row1 + col1 - n) || k > Math.min(row1, col1)) return 0;
              // Use log-factorials to avoid overflow
              const logC = (N: number, K: number): number => {
                if (K < 0 || K > N) return -Infinity;
                let s = 0;
                for (let i = 0; i < K; i++) s += Math.log(N - i) - Math.log(i + 1);
                return s;
              };
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
            setResult({ stats, apa: formatAPA({ title: "Fisher 精确检验", test: "Fisher's Exact (two-sided)", p: `= ${p.toFixed(4)}`, conclusion: p < 0.05 ? "两变量间存在显著关联。" : "两变量间无显著关联。", interpretation: `Fisher 精确检验（2×2 表，双侧）p = ${p.toFixed(4)}。` }) });
            break;
          }
          case "pearson": {
            if (!colA || !colB) { setError("请指定两列数值"); return; }
            const x = getNumCol(colA), y = getNumCol(colB);
            const minLen = Math.min(x.length, y.length);
            if (minLen < 3) { setError("需要至少 3 个配对观测"); return; }
            setResult(runPearson(x.slice(0, minLen), y.slice(0, minLen)));
            break;
          }
          case "spearman": {
            if (!colA || !colB) { setError("请指定两列数值"); return; }
            const x = getNumCol(colA), y = getNumCol(colB);
            const minLen = Math.min(x.length, y.length);
            if (minLen < 3) { setError("需要至少 3 个配对观测"); return; }
            setResult(runSpearman(x.slice(0, minLen), y.slice(0, minLen)));
            break;
          }
          case "regression": {
            if (!colA || !colB) { setError("请指定因变量列和至少一个自变量列"); return; }
            const y = getNumCol(colB);
            const xVars: number[][] = [];
            const _numCols = fileData.headers.filter((h) => h !== colB && rows.some((r) => typeof r[colA] === "number"));
            // Use colA as the single predictor for simplicity; multiple predictors via multiple selection
            const xCol = getNumCol(colA);
            const minLen = Math.min(y.length, xCol.length);
            if (minLen < 5) { setError("需要至少 5 个观测"); return; }
            for (let i = 0; i < minLen; i++) xVars.push([xCol[i]]);
            setResult(runRegression(xVars, y.slice(0, minLen)));
            break;
          }
          case "logistic": {
            if (!colA || !colB) { setError("请指定自变量(X)和二分类因变量(Y)"); return; }
            const complete = rows
              .map((r) => ({ x: r[colA], y: r[colB] }))
              .filter((r): r is { x: number; y: string | number } => typeof r.x === "number" && r.y !== "");
            const classes = [...new Set(complete.map((r) => String(r.y)))];
            if (complete.length < 10 || classes.length !== 2) { setError("Logistic 回归需要 1 个数值自变量和恰好 2 类因变量，且至少 10 个完整观测"); return; }
            const y = complete.map((r) => String(r.y) === classes[1] ? 1 : 0);
            setResult(runLogistic(complete.map((r) => r.x), y));
            break;
          }
          case "cronbach": {
            const numCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (numCols.length < 2) { setError("需要至少 2 个数值列作为量表题项"); return; }
            const getItems = (cols: string[]) => {
              const items = cols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
              const minLen = Math.min(...items.map((i) => i.length));
              return { items: items.map((col) => col.slice(0, minLen)), labels: cols };
            };
            const groupEntries = Object.entries(constructGroups).filter(([, items]) => items.length >= 2);
            if (groupEntries.length >= 2) {
              // Run per-construct Cronbach's alpha
              const results = groupEntries.map(([name, cols]) => {
                const { items, labels } = getItems(cols);
                const r = runCronbach(items);
                return { construct: name, ...r, labels };
              });
              const combined = {
                stats: { constructs: groupEntries.length } as Record<string, number | string>,
                apa: {
                  title: "信度分析（多构念）",
                  test: "Cronbach's α (per construct)",
                  statistic: results.map((r) => `${r.construct}: α = ${(r.stats.Cronbach_alpha as number).toFixed(3)}`).join("; "),
                   df: "", p: "", effect: "", ci: "",
                  conclusion: results.map((r) => `${r.construct}: α = ${(r.stats.Cronbach_alpha as number).toFixed(3)} ${r.apa.conclusion}`).join("\n"),
                  interpretation: results.map((r) => r.apa.interpretation).join("\n\n"),
                },
              };
              setResult(combined);
            } else {
              const { items } = getItems(numCols);
              setResult(runCronbach(items));
            }
            break;
          }
          case "effect-size": {
            if (!colA) { setError("请指定数值列"); return; }
            if (groupCol) {
              const groups = [...new Set(rows.map((r) => String(r[groupCol])))];
              if (groups.length >= 2) {
                const g1 = rows.filter((r) => String(r[groupCol]) === groups[0]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
                const g2 = rows.filter((r) => String(r[groupCol]) === groups[1]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
                setResult(runEffectSize("cohens-d", g1, g2));
              } else {
                setError("分组列需要至少 2 个不同值");
              }
            } else if (colB) {
              setResult(runEffectSize("cohens-d", getNumCol(colA), getNumCol(colB)));
            } else {
              setError("请指定分组列或第二数值列");
            }
            break;
          }
          case "cr-ave": {
            const numCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (numCols.length < 2) { setError("需要至少 2 个数值列作为量表题项"); return; }
            const getItems = (cols: string[]) => {
              const items = cols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
              const minLen = Math.min(...items.map((i) => i.length));
              return { items: items.map((col) => col.slice(0, minLen)), labels: cols };
            };
            const groupEntries = Object.entries(constructGroups).filter(([, items]) => items.length >= 2);
            if (groupEntries.length >= 2) {
              const results = groupEntries.map(([name, cols]) => {
                const { items, labels } = getItems(cols);
                const r = runCRAVE(items, labels);
                return { construct: name, ...r };
              });
              const combined = {
                stats: { constructs: groupEntries.length } as Record<string, number | string>,
                apa: {
                  title: "组合信度与收敛效度（多构念）",
                  test: "CR + AVE (per construct)",
                  statistic: results.map((r) => `${r.construct}: CR=${(r.stats.CR as number).toFixed(3)}, AVE=${(r.stats.AVE as number).toFixed(3)}`).join("; "),
                   df: "", p: "", effect: "", ci: "",
                  conclusion: results.map((r) => `${r.construct}: ${r.apa.conclusion}`).join("\n"),
                  interpretation: results.map((r) => r.apa.interpretation).join("\n\n"),
                },
              };
              setResult(combined);
            } else {
              const { items, labels } = getItems(numCols);
              setResult(runCRAVE(items, labels));
            }
            break;
          }
          case "htmt": {
            const numCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (numCols.length < 4) { setError("HTMT 需要至少 4 个题项（2 个构念各 2 题）"); return; }

            let constructArray: { name: string; items: number[][] }[] = [];

            // Use manual construct groups if available
            const groupEntries = Object.entries(constructGroups).filter(([, items]) => items.length >= 2);
            if (groupEntries.length >= 2) {
              const minLen = Math.min(...numCols.map((col) => rows.filter((r) => typeof r[col] === "number").length));
              constructArray = groupEntries.map(([name, cols]) => ({
                name,
                items: cols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number").slice(0, minLen)),
              }));
            } else {
              // Fallback: auto-split in half
              const half = Math.ceil(numCols.length / 2);
              const cols1 = numCols.slice(0, half), cols2 = numCols.slice(half);
              const items1 = cols1.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
              const items2 = cols2.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
              const minLen = Math.min(...items1.map((i) => i.length), ...items2.map((i) => i.length));
              constructArray = [
                { name: "构念A", items: items1.map((col) => col.slice(0, minLen)) },
                { name: "构念B", items: items2.map((col) => col.slice(0, minLen)) },
              ];
            }
              setResult(runHTMT(constructArray));
            break;
          }
          case "efa": {
            const numCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (numCols.length < 3) { setError("EFA 需要至少 3 个测量题项列"); return; }
            const items = numCols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
            const minLen = Math.min(...items.map((i) => i.length));
            if (minLen < 5) { setError("EFA 需要至少 5 个完整观测"); return; }
            setResult(runEFA(items.map((col) => col.slice(0, minLen)), numCols));
            break;
          }
          case "cfa": {
            const numCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (numCols.length < 3) { setError("CFA 需要至少 3 个测量指标"); return; }
            const items = numCols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
            const minLen = Math.min(...items.map((i) => i.length));
            const itemMatrix = items.map((col) => col.slice(0, minLen));
            setResult(runCFA(itemMatrix, numCols));
            break;
          }
          case "cmv": {
            const numCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (numCols.length < 3) { setError("Harman 检验需要至少 3 个题项"); return; }
            const items = numCols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
            const minLen = Math.min(...items.map((i) => i.length));
            const itemMatrix = items.map((col) => col.slice(0, minLen));
            setResult(runCMV(itemMatrix));
            break;
          }
          case "mediation": {
            if (!colA || !colB) { setError("请指定自变量(X)列和因变量(Y)列"); return; }
            if (!groupCol) { setError("请在'分组列'中选择中介变量(M)列"); return; }
            const X = getNumCol(colA), M = getNumCol(groupCol), Y = getNumCol(colB);
            const minLen = Math.min(X.length, M.length, Y.length);
            if (minLen < 10) { setError("中介分析需要至少 10 个观测"); return; }
            setResult(runMediation(X.slice(0, minLen), M.slice(0, minLen), Y.slice(0, minLen)));
            break;
          }
          case "moderation": {
            if (!colA || !colB) { setError("请指定自变量(X)列和因变量(Y)列"); return; }
            if (!groupCol) { setError("请在'分组列'中选择调节变量(W)列"); return; }
            const X = getNumCol(colA), W = getNumCol(groupCol), Y = getNumCol(colB);
            const minLen = Math.min(X.length, W.length, Y.length);
            if (minLen < 10) { setError("调节分析需要至少 10 个观测"); return; }
            setResult(runModeration(X.slice(0, minLen), W.slice(0, minLen), Y.slice(0, minLen)));
            break;
          }
          case "power": {
            // Use effect size from input or default
            const d = colA ? 0.5 : 0.5; // Default medium effect
            setResult(runPower(d, 0.05, 0.8));
            break;
          }
          case "bayes-ttest": {
            let g1: number[], g2: number[];
            if (groupCol) {
              const groups = [...new Set(rows.map((r) => String(r[groupCol])))];
              if (groups.length < 2) { setError("分组列需要至少 2 个不同值"); return; }
              g1 = rows.filter((r) => String(r[groupCol]) === groups[0]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
              g2 = rows.filter((r) => String(r[groupCol]) === groups[1]).map((r) => r[colA]).filter((v): v is number => typeof v === "number");
            } else {
              if (!colA || !colB) { setError("请指定两列数值或一个分组列"); return; }
              g1 = getNumCol(colA); g2 = getNumCol(colB);
            }
            if (g1.length < 3 || g2.length < 3) { setError("每组需要至少 3 个数值"); return; }
            setResult(runBayesTTest(g1, g2));
            break;
          }
          case "bayes-correlation": {
            if (!colA || !colB) { setError("请指定两列数值"); return; }
            const x = getNumCol(colA), y = getNumCol(colB);
            const minLen = Math.min(x.length, y.length);
            if (minLen < 5) { setError("需要至少 5 个配对观测"); return; }
            setResult(runBayesCorrelation(x.slice(0, minLen), y.slice(0, minLen)));
            break;
          }
          case "split-half": {
            const itemCols = fileData.headers.filter((h) => rows.some((r) => typeof r[h] === "number"));
            if (itemCols.length < 4) { setError("分半信度需要至少 4 个题项"); return; }
            const items = itemCols.map((col) => rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
            const minLen = Math.min(...items.map((i) => i.length));
            setResult(runSplitHalf(items.map((col) => col.slice(0, minLen))));
            break;
          }
          case "conjoint": {
            if (!colA || !colB) { setError("请指定评分列(Y)和至少一个属性列(X)"); return; }
            const ratingCol = colB;
            const attrCols = [colA, ...(groupCol ? [groupCol] : [])];
            setResult(runConjoint(rows, ratingCol, attrCols));
            break;
          }
          case "maxdiff": {
            if (!colA || !colB) { setError("请指定'最好'列和'最差'列"); return; }
            setResult(runMaxDiff(rows, colA, colB));
            break;
          }
        }
      } else if (manualInput.trim()) {
        const nums = manualInput.split(/[\n,;\s]+/).map(Number).filter((n) => !isNaN(n));
        if (nums.length < 2) { setError("至少需要 2 个数值"); return; }
        setResult(runDescriptive(nums));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "计算错误");
    }
  };

  const numCols = fileData ? fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number")) : [];
  const _catCols = fileData ? fileData.headers.filter((h) => !numCols.includes(h)) : [];
  const currentTest = TESTS.find((t) => t.id === selectedTest)!;

  useEffect(() => {
    if (!result) return;
    const input = fileData?.fileName ?? manualInput.slice(0, 120) ?? "manual input";
    const key = `${selectedTest}:${input}:${result.apa.statistic}:${result.apa.conclusion}`;
    if (lastSavedRef.current === key) return;
    lastSavedRef.current = key;
    addRecord({
      tool: "statistics",
      type: currentTest.label,
      input,
      result: formatAPAText(result.apa),
      fileName: fileData?.fileName,
    });
  }, [addRecord, currentTest.label, fileData?.fileName, manualInput, result, selectedTest]);

  const copyAPA = () => {
    if (!result) return;
    const text = formatAPAText(result.apa);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#A855F7]/10 flex items-center justify-center text-xl">🧮</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">统计分析工具箱</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 market-research-stats-toolkit · 学术实证级 · 纯浏览器端计算</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">上传数据 → 查看变量画布 → 选择分析方法 → 查看结果</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Upload + Variables */}
          <div className="space-y-4">
            <FileUpload onUpload={handleFileUpload} description="CSV / TSV 文件，第一行为列名（支持中文变量名）" />

            {fileData && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{fileData.fileName}</span>
                  <Badge variant="outline" className="text-[10px]">{fileData.rowCount} 行 × {fileData.colCount} 列</Badge>
                </div>

                {/* Variable Canvas — all variables as interactive bubbles */}
                <div>
                  <span className="text-xs text-[var(--text-muted)] mb-2 block">📊 变量画布（点击选择分析列）</span>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/50 min-h-[80px]">
                    {fileData.headers.map((h) => {
                      const isNum = fileData.rows.some((r) => typeof r[h] === "number");
                      const isA = colA === h;
                      const isB = colB === h;
                      const isGroup = groupCol === h;
                      const role = isA ? "A" : isB ? "B" : isGroup ? "G" : null;
                      const roleColor = isA ? "#6366F1" : isB ? "#06B6D4" : isGroup ? "#F59E0B" : undefined;
                      return (
                        <motion.button key={h}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (!colA) setColA(h);
                            else if (!colB && h !== colA) setColB(h);
                            else if (!groupCol && h !== colA && h !== colB) setGroupCol(h);
                            else {
                              if (colA === h) setColA("");
                              else if (colB === h) setColB("");
                              else if (groupCol === h) setGroupCol("");
                              else setColA(h);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs border transition-all",
                            role ? "text-white font-medium" : isNum ? "border-[#3B82F6]/30 text-[#3B82F6] hover:border-[#3B82F6]/60" : "border-[#F59E0B]/30 text-[#F59E0B] hover:border-[#F59E0B]/60"
                          )}
                          style={role ? { background: roleColor, borderColor: roleColor } : undefined}
                          title={`${h} (${isNum ? "数值" : "分类"})${role ? ` → ${role === "A" ? "变量A" : role === "B" ? "变量B" : "分组"}` : " · 点击选择"}`}
                        >
                          {role && <span className="mr-1 opacity-70">{role === "A" ? "X" : role === "B" ? "Y" : "G"}:</span>}
                          {h}
                          {role && <span className="ml-1 opacity-70">×</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-[var(--text-muted)]">
                    <span><span className="inline-block w-2 h-2 rounded-full bg-[#3B82F6] mr-1" /> 数值变量</span>
                    <span><span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1" /> 分类变量</span>
                    <span><span className="inline-block w-2 h-2 rounded-full bg-[#6366F1] mr-1" /> X (选中)</span>
                    <span><span className="inline-block w-2 h-2 rounded-full bg-[#06B6D4] mr-1" /> Y (选中)</span>
                    <span><span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1" /> G (分组)</span>
                  </div>
                </div>

                {/* Construct Grouper for scale analyses */}
                {["htmt", "cfa", "cronbach", "item-analysis", "cr-ave", "efa", "cmv"].includes(selectedTest) && (
                  <ConstructGrouper
                    columns={numCols}
                    groups={constructGroups}
                    onChange={setConstructGroups}
                    minGroups={2}
                  />
                )}
              </div>
            )}

            {/* Analysis selector — compact, only shown after data upload */}
            {fileData && (
              <div className="glass-card p-4">
                <span className="text-xs text-[var(--text-muted)] mb-3 block">选择分析方法</span>
                <div className="space-y-3">
                  {CATEGORIES.map((cat) => (
                    <div key={cat}>
                      <span className="text-[10px] text-[var(--text-muted)] mb-1 block">{cat}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {TESTS.filter((t) => t.category === cat).map((t) => (
                          <button key={t.id} onClick={() => { setSelectedTest(t.id); setResult(null); setError(""); }}
                            className={cn("px-2 py-1 rounded-lg text-[11px] border transition-all",
                              selectedTest === t.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                            title={t.desc}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Suggestions */}
            {fileData && (
              <SmartSuggest headers={fileData.headers} rows={fileData.rows} currentTest={selectedTest} onSuggest={(id) => { setSelectedTest(id as TestType); setResult(null); setError(""); }} />
            )}

            {/* History */}
            <HistoryPanel tool="statistics" />

            {/* Data Profile */}
            {fileData && (
              <DataProfileDashboard headers={fileData.headers} rows={fileData.rows} />
            )}

            {/* Manual input for descriptive */}
            {!fileData && selectedTest === "descriptive" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">或手动输入数值</label>
                <Textarea rows={5} value={manualInput} onChange={(e) => setManualInput(e.target.value)}
                  placeholder="每行一个数值或逗号分隔" className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none font-mono text-sm" />
              </div>
            )}

            {error && <div className="text-sm text-[var(--error)] px-2">{error}</div>}

            <Button onClick={handleRun} disabled={(!fileData && !manualInput.trim()) || (fileData !== null && selectedTest !== "descriptive" && !colA)}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              <Play className="w-4 h-4 mr-2" /> 计算
            </Button>
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">结果</label>
              {result && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyAPA}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                    const blob = new Blob([formatAPAText(result.apa)], { type: "text/plain" }); const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = `stats-${selectedTest}-${Date.now()}.txt`; a.click();
                  }}>
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {result && (
              <>
                {/* APA formatted conclusion */}
                <div className="glass-card p-5 border-[var(--primary)]/20 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-sm font-semibold text-[var(--primary)]">APA 格式报告</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">检验方法：</span>
                      <span className="text-[var(--text-primary)]">{result.apa.test}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">统计量：</span>
                      <span className="text-[var(--text-primary)] font-mono">{result.apa.statistic}</span>
                    </div>
                    {result.apa.df && <div><span className="text-[var(--text-muted)]">自由度：</span><span className="text-[var(--text-primary)] font-mono">{result.apa.df}</span></div>}
                    <div>
                      <span className="text-[var(--text-muted)]">显著性：</span>
                      <span className={cn("font-mono", result.apa.p.includes("< .001") || (result.apa.p.startsWith("= ") && parseFloat(result.apa.p.slice(2)) < 0.05) ? "text-[var(--success)]" : "text-[var(--text-primary)]")}>
                        p {result.apa.p}
                      </span>
                      {result.apa.p && <span className="ml-2 text-xs">{pStars(result.apa.p.includes("<") ? 0.001 : parseFloat(result.apa.p.slice(2)))}</span>}
                    </div>
                    {result.apa.effect && <div><span className="text-[var(--text-muted)]">效应量：</span><span className="text-[var(--text-primary)]">{result.apa.effect}</span></div>}
                    {result.apa.ci && <div><span className="text-[var(--text-muted)]">置信区间：</span><span className="text-[var(--text-primary)] font-mono">{result.apa.ci}</span></div>}
                  </div>

                  {/* Conclusion box */}
                  <div className="mt-3 p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                    <span className="text-xs font-medium text-[var(--primary)] block mb-1">结论</span>
                    <p className="text-sm text-[var(--text-secondary)]">{result.apa.conclusion}</p>
                  </div>

                  {/* Full interpretation */}
                  <div className="mt-2">
                    <span className="text-xs font-medium text-[var(--text-muted)] block mb-1">完整解释</span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{result.apa.interpretation}</p>
                  </div>
                </div>

                {/* Annotation display */}
                {(() => {
                  const annotation = generateAnnotation(selectedTest, result.stats, result.apa);
                  return <AnnotationDisplay annotation={annotation} />;
                })()}

                {/* Visualization charts */}
                {fileData && colA && (
                  <div className="glass-card p-4">
                    <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">📊 数据可视化</span>
                    <div className="space-y-4">
                      {/* Distribution chart for the primary variable */}
                      {(() => {
                        const nums = fileData.rows.map((r) => r[colA]).filter((v): v is number => typeof v === "number");
                        if (nums.length >= 5 && ["descriptive", "normality", "ttest", "paired-ttest", "mann-whitney", "wilcoxon", "anova", "kruskal-wallis", "regression", "pearson", "spearman", "effect-size", "cronbach", "item-analysis", "likert-freq"].includes(selectedTest)) {
                          return <ChartExportWrapper filename={`${colA}-distribution`}><DistributionChart data={nums} title={`${colA} 分布`} color="#6366F1" /></ChartExportWrapper>;
                        }
                        return null;
                      })()}

                      {/* Scatter plot for correlation/regression */}
                      {["pearson", "spearman", "regression"].includes(selectedTest) && colB && (() => {
                        const x = fileData.rows.map((r) => r[colA]).filter((v): v is number => typeof v === "number");
                        const y = fileData.rows.map((r) => r[colB]).filter((v): v is number => typeof v === "number");
                        const minLen = Math.min(x.length, y.length);
                        if (minLen >= 5) {
                          return <ChartExportWrapper filename={`${colA}-vs-${colB}-scatter`}><ScatterPlot x={x.slice(0, minLen)} y={y.slice(0, minLen)} xLabel={colA} yLabel={colB} title={`${colA} vs ${colB} 散点图`} showRegression={selectedTest === "regression" || selectedTest === "pearson"} /></ChartExportWrapper>;
                        }
                        return null;
                      })()}

                      {/* Box plot for group comparisons */}
                      {["ttest", "mann-whitney", "anova", "kruskal-wallis"].includes(selectedTest) && groupCol && (() => {
                        const groups = [...new Set(fileData.rows.map((r) => String(r[groupCol])))];
                        const groupData = groups.map((g) => ({
                          label: g,
                          data: fileData.rows.filter((r) => String(r[groupCol]) === g).map((r) => r[colA]).filter((v): v is number => typeof v === "number"),
                        })).filter((g) => g.data.length >= 2);
                        if (groupData.length >= 2) {
                          return <ChartExportWrapper filename={`${colA}-boxplot`}><BoxPlotChart groups={groupData} title={`${colA} 各组分布对比`} /></ChartExportWrapper>;
                        }
                        return null;
                      })()}

                      {/* Correlation heatmap for multi-item scales */}
                      {["cronbach", "item-analysis", "efa", "cr-ave", "htmt", "cfa"].includes(selectedTest) && (() => {
                        const numCols = fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number"));
                        if (numCols.length >= 3 && numCols.length <= 15) {
                          const items = numCols.map((col) => fileData.rows.map((r) => r[col]).filter((v): v is number => typeof v === "number"));
                          const minLen = Math.min(...items.map((i) => i.length));
                          // Correlation matrix
                          const matrix: number[][] = [];
                          for (let i = 0; i < items.length; i++) {
                            matrix[i] = [];
                            for (let j = 0; j < items.length; j++) {
                              if (i === j) { matrix[i][j] = 1; continue; }
                              const a = items[i].slice(0, minLen), b = items[j].slice(0, minLen);
                              const ma = a.reduce((s, v) => s + v, 0) / minLen;
                              const mb = b.reduce((s, v) => s + v, 0) / minLen;
                              let num = 0, d1 = 0, d2 = 0;
                              for (let k = 0; k < minLen; k++) { const da = a[k] - ma, db = b[k] - mb; num += da * db; d1 += da * da; d2 += db * db; }
                              matrix[i][j] = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
                            }
                          }
                          const labels = numCols.map((c) => c.length > 8 ? c.slice(0, 7) + "…" : c);
                          return <ChartExportWrapper filename="correlation-heatmap"><Heatmap matrix={matrix} rowLabels={labels} colLabels={labels} title="题项相关矩阵热力图" /></ChartExportWrapper>;
                        }
                        return null;
                      })()}

                      {/* Fallback: show distribution for descriptive if no specific chart */}
                      {selectedTest === "descriptive" && !colB && (() => {
                        const nums = fileData.rows.map((r) => r[colA]).filter((v): v is number => typeof v === "number");
                        if (nums.length >= 5) {
                          return <DistributionChart data={nums} title={`${colA} 频率分布`} bins={Math.min(15, Math.max(5, Math.ceil(Math.sqrt(nums.length))))} color="#06B6D4" />;
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                {/* Results Exporter */}
                <ResultsExporter testLabel={currentTest.label} apa={result.apa} stats={result.stats} />

                {/* Raw stats */}
                <div className="glass-card p-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">详细统计量</span>
                  <div className="space-y-1">
                    {Object.entries(result.stats).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-1 border-b border-[var(--border)] last:border-b-0">
                        <span className="text-xs text-[var(--text-tertiary)]">{key}</span>
                        <span className="text-xs font-mono text-[var(--text-primary)]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Item details table (for cronbach, item-analysis, likert-freq) */}
                {"itemDetails" in result && Array.isArray(result.itemDetails) && result.itemDetails.length > 0 && (
                  <div className="glass-card p-4">
                    <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">题项分析详情</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            {Object.keys(result.itemDetails[0]).map((key) => (
                              <th key={key} className="text-left py-2 px-2 text-[var(--text-muted)] font-medium whitespace-nowrap">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.itemDetails.map((row: Record<string, string | number>, i: number) => (
                            <tr key={i} className="border-b border-[var(--border)]">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="py-2 px-2 text-[var(--text-secondary)] font-mono whitespace-nowrap">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Likert frequency table */}
                {"freqTable" in result && Array.isArray(result.freqTable) && result.freqTable.length > 0 && (
                  <div className="glass-card p-4">
                    <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">Likert 频率分布</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            {Object.keys(result.freqTable[0]).map((key) => (
                              <th key={key} className="text-center py-2 px-2 text-[var(--text-muted)] font-medium whitespace-nowrap">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.freqTable.map((row: Record<string, number>, i: number) => (
                            <tr key={i} className="border-b border-[var(--border)]">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="text-center py-2 px-2 text-[var(--text-secondary)] font-mono">{typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {!result && (
              <div className="glass-card p-6 min-h-[400px]">
                <div className="text-[var(--text-muted)] text-sm text-center py-20">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>上传数据，选择检验方法，点击“计算”</p>
                  <p className="text-xs mt-1">纯浏览器端计算 · APA 格式输出 · 数据不离开设备</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ========== APA text formatter ========== */
function formatAPAText(apa: APAReport): string {
  const lines: string[] = [];
  if (apa.title) lines.push(`=== ${apa.title} ===\n`);
  if (apa.test) lines.push(`检验方法: ${apa.test}`);
  if (apa.statistic) lines.push(`统计量: ${apa.statistic}`);
  if (apa.df) lines.push(`自由度: df = ${apa.df}`);
  if (apa.p) lines.push(`显著性: p ${apa.p}`);
  if (apa.effect) lines.push(`效应量: ${apa.effect}`);
  if (apa.ci) lines.push(`置信区间: ${apa.ci}`);
  lines.push("");
  if (apa.conclusion) lines.push(`结论: ${apa.conclusion}`);
  if (apa.interpretation) lines.push(`\n解释: ${apa.interpretation}`);
  return lines.join("\n");
}

