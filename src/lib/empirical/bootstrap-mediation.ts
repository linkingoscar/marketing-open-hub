/**
 * Hayes PROCESS Model 4 简单中介效应分析引擎
 * 采用学术界通行的非参数 Bootstrap（有放回重抽样）计算间接效应 95% 置信区间
 *
 * 理论模型：
 * 1) M = i1 + a*X + e1        (自变量对中介变量的效应)
 * 2) Y = i2 + c'*X + b*M + e2  (控制中介变量后，自变量与中介变量对因变量的效应)
 * 3) Y = i3 + c*X + e3         (总效应模型)
 *
 * 间接效应 (Indirect Effect): ab = a * b
 * 直接效应 (Direct Effect): c'
 * 总效应 (Total Effect): c = c' + ab
 */

import { normalCDF } from "../statistics/math";

export interface MediationInput {
  x: number[];
  m: number[];
  y: number[];
  bootstraps?: number; // 默认 1000 次重抽样
  confidenceLevel?: number; // 默认 0.95
}

export interface EffectReport {
  effect: number;
  se: number;
  t: number;
  p: number;
  llci: number;
  ulci: number;
}

export interface IndirectEffectReport {
  effect: number;
  bootSE: number;
  bootLLCI: number;
  bootULCI: number;
  significant: boolean;
  ratio: number; // 间接效应占总效应比例
}

export interface MediationResult {
  n: number;
  bootstraps: number;
  totalEffect: EffectReport; // c
  directEffect: EffectReport; // c'
  pathA: EffectReport; // a: X -> M
  pathB: EffectReport; // b: M -> Y (controlling X)
  indirectEffect: IndirectEffectReport; // ab
  mediationType: "full" | "partial" | "none";
  apaSummary: string;
  tableData: {
    model: string;
    path: string;
    coeff: number;
    se: number;
    t: number;
    p: string;
    ci: string;
  }[];
}

/**
 * 简单一元线性回归：y = alpha + beta * x
 */
function simpleRegression(
  x: number[],
  y: number[]
): {
  intercept: number;
  beta: number;
  se: number;
  t: number;
  p: number;
  llci: number;
  ulci: number;
  r2: number;
} {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;

  let ssxx = 0,
    ssxy = 0,
    ssyy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    ssxx += dx * dx;
    ssxy += dx * dy;
    ssyy += dy * dy;
  }

  const beta = ssxx > 1e-12 ? ssxy / ssxx : 0;
  const intercept = my - beta * mx;

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yHat = intercept + beta * x[i];
    ssRes += (y[i] - yHat) ** 2;
  }

  const r2 = ssyy > 1e-12 ? Math.max(0, 1 - ssRes / ssyy) : 0;
  const df = Math.max(1, n - 2);
  const mse = ssRes / df;
  const se = ssxx > 1e-12 ? Math.sqrt(mse / ssxx) : 0;
  const t = se > 1e-12 ? beta / se : 0;
  const p = 2 * (1 - normalCDF(Math.abs(t)));

  const zCrit = 1.96;
  const llci = beta - zCrit * se;
  const ulci = beta + zCrit * se;

  return {
    intercept: +intercept.toFixed(4),
    beta: +beta.toFixed(4),
    se: +se.toFixed(4),
    t: +t.toFixed(4),
    p: +p.toFixed(6),
    llci: +llci.toFixed(4),
    ulci: +ulci.toFixed(4),
    r2: +r2.toFixed(4),
  };
}

/**
 * 二元多元线性回归：y = alpha + b1 * x1 + b2 * x2
 */
function multipleRegression(
  x1: number[],
  x2: number[],
  y: number[]
): {
  intercept: number;
  b1: number;
  b2: number;
  se1: number;
  se2: number;
  t1: number;
  t2: number;
  p1: number;
  p2: number;
  r2: number;
} {
  const n = y.length;
  const m1 = x1.reduce((s, v) => s + v, 0) / n;
  const m2 = x2.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;

  let s11 = 0,
    s22 = 0,
    s12 = 0,
    s1y = 0,
    s2y = 0,
    syy = 0;
  for (let i = 0; i < n; i++) {
    const d1 = x1[i] - m1;
    const d2 = x2[i] - m2;
    const dy = y[i] - my;
    s11 += d1 * d1;
    s22 += d2 * d2;
    s12 += d1 * d2;
    s1y += d1 * dy;
    s2y += d2 * dy;
    syy += dy * dy;
  }

  const det = s11 * s22 - s12 * s12;
  const safeDet = Math.abs(det) < 1e-12 ? 1e-12 : det;

  const b1 = (s22 * s1y - s12 * s2y) / safeDet;
  const b2 = (s11 * s2y - s12 * s1y) / safeDet;
  const intercept = my - b1 * m1 - b2 * m2;

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yHat = intercept + b1 * x1[i] + b2 * x2[i];
    ssRes += (y[i] - yHat) ** 2;
  }

  const r2 = syy > 1e-12 ? Math.max(0, 1 - ssRes / syy) : 0;
  const df = Math.max(1, n - 3);
  const mse = ssRes / df;

  const se1 = Math.sqrt(Math.max(0, (mse * s22) / safeDet));
  const se2 = Math.sqrt(Math.max(0, (mse * s11) / safeDet));

  const t1 = se1 > 1e-12 ? b1 / se1 : 0;
  const t2 = se2 > 1e-12 ? b2 / se2 : 0;

  const p1 = 2 * (1 - normalCDF(Math.abs(t1)));
  const p2 = 2 * (1 - normalCDF(Math.abs(t2)));

  return {
    intercept: +intercept.toFixed(4),
    b1: +b1.toFixed(4),
    b2: +b2.toFixed(4),
    se1: +se1.toFixed(4),
    se2: +se2.toFixed(4),
    t1: +t1.toFixed(4),
    t2: +t2.toFixed(4),
    p1: +p1.toFixed(6),
    p2: +p2.toFixed(6),
    r2: +r2.toFixed(4),
  };
}

/**
 * 运行 Hayes Model 4 中介分析并进行非参数 Bootstrap 重抽样
 */
export function runBootstrapMediation(input: MediationInput): MediationResult {
  const { x, m, y, bootstraps = 1000, confidenceLevel = 0.95 } = input;
  const n = Math.min(x.length, m.length, y.length);
  if (n < 5) {
    throw new Error("中介效应分析至少需要 5 个有效观测样本");
  }

  const cleanX = x.slice(0, n);
  const cleanM = m.slice(0, n);
  const cleanY = y.slice(0, n);

  // 1. 总效应方程: Y = i3 + c*X
  const totalModel = simpleRegression(cleanX, cleanY);
  const totalEffect: EffectReport = {
    effect: totalModel.beta,
    se: totalModel.se,
    t: totalModel.t,
    p: totalModel.p,
    llci: totalModel.llci,
    ulci: totalModel.ulci,
  };

  // 2. 中介方程: M = i1 + a*X
  const pathAModel = simpleRegression(cleanX, cleanM);
  const pathA: EffectReport = {
    effect: pathAModel.beta,
    se: pathAModel.se,
    t: pathAModel.t,
    p: pathAModel.p,
    llci: pathAModel.llci,
    ulci: pathAModel.ulci,
  };

  // 3. 结局方程: Y = i2 + c'*X + b*M
  const multiModel = multipleRegression(cleanX, cleanM, cleanY);
  const directEffect: EffectReport = {
    effect: multiModel.b1,
    se: multiModel.se1,
    t: multiModel.t1,
    p: multiModel.p1,
    llci: +(multiModel.b1 - 1.96 * multiModel.se1).toFixed(4),
    ulci: +(multiModel.b1 + 1.96 * multiModel.se1).toFixed(4),
  };

  const pathB: EffectReport = {
    effect: multiModel.b2,
    se: multiModel.se2,
    t: multiModel.t2,
    p: multiModel.p2,
    llci: +(multiModel.b2 - 1.96 * multiModel.se2).toFixed(4),
    ulci: +(multiModel.b2 + 1.96 * multiModel.se2).toFixed(4),
  };

  // 点估计间接效应
  const indirectPointEstimate = +(pathA.effect * pathB.effect).toFixed(4);

  // 4. 非参数 Bootstrap 抽样检验
  const bootEstimates: number[] = new Array(bootstraps);
  for (let b = 0; b < bootstraps; b++) {
    // 有放回抽样
    const bootX: number[] = new Array(n);
    const bootM: number[] = new Array(n);
    const bootY: number[] = new Array(n);

    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      bootX[i] = cleanX[idx];
      bootM[i] = cleanM[idx];
      bootY[i] = cleanY[idx];
    }

    const regM = simpleRegression(bootX, bootM);
    const regY = multipleRegression(bootX, bootM, bootY);
    bootEstimates[b] = regM.beta * regY.b2;
  }

  // 计算 Bootstrap 置信区间 (Percentile method)
  bootEstimates.sort((p1, p2) => p1 - p2);
  const alpha = 1 - confidenceLevel;
  const lowerIndex = Math.floor((alpha / 2) * bootstraps);
  const upperIndex = Math.min(bootstraps - 1, Math.ceil((1 - alpha / 2) * bootstraps));

  const bootLLCI = +bootEstimates[lowerIndex].toFixed(4);
  const bootULCI = +bootEstimates[upperIndex].toFixed(4);

  // 计算 Bootstrap 标准误
  const bootMean = bootEstimates.reduce((s, v) => s + v, 0) / bootstraps;
  const bootSE = +Math.sqrt(
    bootEstimates.reduce((s, v) => s + (v - bootMean) ** 2, 0) / (bootstraps - 1)
  ).toFixed(4);

  // 判断中介显著性：95% 置信区间不跨 0 即显著
  const significant = (bootLLCI > 0 && bootULCI > 0) || (bootLLCI < 0 && bootULCI < 0);

  // 中介类型判断
  let mediationType: "full" | "partial" | "none" = "none";
  if (significant) {
    if (directEffect.p > 0.05) {
      mediationType = "full"; // 直接效应不显著 -> 完全中介
    } else {
      mediationType = "partial"; // 直接效应仍显著 -> 部分中介
    }
  }

  const ratio =
    totalEffect.effect !== 0 ? +(indirectPointEstimate / totalEffect.effect).toFixed(4) : 0;

  // 生成 APA 报告文案
  const sigText = significant
    ? `Bootstrap 95% 置信区间 [${bootLLCI}, ${bootULCI}] 不包含 0，中介效应显著成立（${mediationType === "full" ? "完全中介" : "部分中介"}）`
    : `Bootstrap 95% 置信区间 [${bootLLCI}, ${bootULCI}] 包含 0，中介效应未达到统计显著水平`;

  const apaSummary =
    `采用 Hayes (2013) 提出的 PROCESS 宏程序（Model 4）进行中介效应检验，重抽样次数设为 ${bootstraps} 次。` +
    `分析结果显示，自变量对中介变量的预测效应${pathA.p < 0.05 ? "显著" : "未达显著水平"}（a = ${pathA.effect.toFixed(3)}, t = ${pathA.t.toFixed(2)}, p ${pathA.p < 0.001 ? "< .001" : `= ${pathA.p.toFixed(3)}`}）；` +
    `在控制自变量后，中介变量对因变量的预测效应${pathB.p < 0.05 ? "显著" : "未达显著水平"}（b = ${pathB.effect.toFixed(3)}, t = ${pathB.t.toFixed(2)}, p ${pathB.p < 0.001 ? "< .001" : `= ${pathB.p.toFixed(3)}`}）。` +
    `间接效应估计值 ab = ${indirectPointEstimate.toFixed(3)}，Boot SE = ${bootSE.toFixed(3)}，${sigText}。` +
    (significant && totalEffect.effect !== 0
      ? ` 间接效应占总效应的比例为 ${(ratio * 100).toFixed(1)}%。`
      : "");

  const tableData = [
    {
      model: "模型 1 (M = aX)",
      path: "X → M (a)",
      coeff: pathA.effect,
      se: pathA.se,
      t: pathA.t,
      p: pathA.p < 0.001 ? "< .001" : pathA.p.toFixed(3),
      ci: `[${pathA.llci}, ${pathA.ulci}]`,
    },
    {
      model: "模型 2 (Y = c'X + bM)",
      path: "M → Y (b)",
      coeff: pathB.effect,
      se: pathB.se,
      t: pathB.t,
      p: pathB.p < 0.001 ? "< .001" : pathB.p.toFixed(3),
      ci: `[${pathB.llci}, ${pathB.ulci}]`,
    },
    {
      model: "模型 2 (Y = c'X + bM)",
      path: "直接效应 X → Y (c')",
      coeff: directEffect.effect,
      se: directEffect.se,
      t: directEffect.t,
      p: directEffect.p < 0.001 ? "< .001" : directEffect.p.toFixed(3),
      ci: `[${directEffect.llci}, ${directEffect.ulci}]`,
    },
    {
      model: "模型 3 (Y = cX)",
      path: "总效应 X → Y (c)",
      coeff: totalEffect.effect,
      se: totalEffect.se,
      t: totalEffect.t,
      p: totalEffect.p < 0.001 ? "< .001" : totalEffect.p.toFixed(3),
      ci: `[${totalEffect.llci}, ${totalEffect.ulci}]`,
    },
  ];

  return {
    n,
    bootstraps,
    totalEffect,
    directEffect,
    pathA,
    pathB,
    indirectEffect: {
      effect: indirectPointEstimate,
      bootSE,
      bootLLCI,
      bootULCI,
      significant,
      ratio,
    },
    mediationType,
    apaSummary,
    tableData,
  };
}
