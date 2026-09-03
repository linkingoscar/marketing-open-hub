import {
  mean,
  stddev,
  normalCDF,
  tDistCDF,
  fDistCDF,
  chiDistCDF,
  pStars,
  matMul,
  transpose,
  matInv,
  matVecMul,
} from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

export function runRegression(
  x: number[][],
  y: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const n = y.length,
    p = x[0].length;
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
  const rSq = ssTot > 0 ? Math.max(0, ssReg / ssTot) : 0;
  const dfResidual = Math.max(1, n - p - 1);
  const rSqAdj = 1 - ((1 - rSq) * (n - 1)) / dfResidual;
  const msRes = ssRes / dfResidual;
  const F = msRes > 0 ? ssReg / p / msRes : 0;
  const fP = 1 - fDistCDF(F, p, dfResidual);

  const seBeta = XtXinv.map((row, i) => Math.sqrt(Math.max(0, row[i] * msRes)));
  const tStats = beta.map((b, i) => (seBeta[i] > 0 ? b / seBeta[i] : 0));
  const pValues = tStats.map((t) => 2 * (1 - tDistCDF(Math.abs(t), dfResidual)));

  let dwNum = 0,
    dwDen = 0;
  for (let i = 0; i < n; i++) {
    dwDen += residuals[i] ** 2;
  }
  for (let i = 1; i < n; i++) {
    dwNum += (residuals[i] - residuals[i - 1]) ** 2;
  }
  const dw = dwDen > 0 ? dwNum / dwDen : 0;

  const stats: Record<string, number | string> = {
    R_squared: +rSq.toFixed(4),
    R_squared_adj: +rSqAdj.toFixed(4),
    F: +F.toFixed(4),
    df_regression: p,
    df_residual: dfResidual,
    p_model: +fP.toFixed(6),
    Durbin_Watson: +dw.toFixed(4),
    intercept: +beta[0].toFixed(4),
    intercept_SE: +seBeta[0].toFixed(4),
    intercept_t: +tStats[0].toFixed(4),
    intercept_p: +pValues[0].toFixed(6),
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
    statistic: `F(${p}, ${dfResidual}) = ${F.toFixed(2)}`,
    df: `${p}, ${dfResidual}`,
    p: `${fP < 0.001 ? "< .001" : `= ${fP.toFixed(3)}`}`,
    effect: `R² = ${rSq.toFixed(2)}, R²adj = ${rSqAdj.toFixed(2)}`,
    conclusion:
      fP < 0.05
        ? `回归模型整体显著（${pStars(fP)}），解释了因变量 ${(rSq * 100).toFixed(1)}% 的变异。`
        : "回归模型整体不显著。",
    interpretation: `多元线性回归分析（N = ${n}, 预测变量 = ${p}）结果表明模型整体${
      fP < 0.05 ? "显著" : "不显著"
    }，F(${p}, ${dfResidual}) = ${F.toFixed(2)}，p ${fP < 0.001 ? "< .001" : `= ${fP.toFixed(3)}`}，R² = ${rSq.toFixed(
      2
    )}，调整后 R² = ${rSqAdj.toFixed(2)}。截距 b₀ = ${beta[0].toFixed(2)}（p ${
      pValues[0] < 0.001 ? "< .001" : `= ${pValues[0].toFixed(3)}`
    }）。${Array.from(
      { length: p },
      (_, j) =>
        `自变量${j + 1} β = ${beta[j + 1].toFixed(2)}（SE = ${seBeta[j + 1].toFixed(2)}，t = ${tStats[
          j + 1
        ].toFixed(2)}，p ${pValues[j + 1] < 0.001 ? "< .001" : `= ${pValues[j + 1].toFixed(3)}`}）`
    ).join("；")}。Durbin-Watson = ${dw.toFixed(2)}（${
      dw < 1.5 ? "可能存在正自相关" : dw > 2.5 ? "可能存在负自相关" : "无显著自相关"
    }）。`,
  });
  return { stats, apa };
}

export function runLogistic(
  x: number[],
  y: number[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const n = Math.min(x.length, y.length);
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  const xMean = mean(xs);
  const xSd = stddev(xs) || 1;
  const zx = xs.map((v) => (v - xMean) / xSd);
  let b0 = Math.log(
    (ys.reduce((s, v) => s + v, 0) + 0.5) / (n - ys.reduce((s, v) => s + v, 0) + 0.5)
  );
  let b1 = 0;
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-35, Math.min(35, z))));

  for (let iter = 0; iter < 2500; iter++) {
    let g0 = 0,
      g1 = 0,
      h00 = 0,
      h01 = 0,
      h11 = 0;
    for (let i = 0; i < n; i++) {
      const p = sigmoid(b0 + b1 * zx[i]);
      const w = Math.max(1e-6, p * (1 - p));
      const err = ys[i] - p;
      g0 += err;
      g1 += err * zx[i];
      h00 += w;
      h01 += w * zx[i];
      h11 += w * zx[i] * zx[i];
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
  const llModel = probs.reduce(
    (s, p, i) =>
      s + ys[i] * Math.log(Math.max(1e-12, p)) + (1 - ys[i]) * Math.log(Math.max(1e-12, 1 - p)),
    0
  );
  const yRate = ys.reduce((s, v) => s + v, 0) / n;
  const llNull = ys.reduce(
    (s, v) =>
      s + v * Math.log(Math.max(1e-12, yRate)) + (1 - v) * Math.log(Math.max(1e-12, 1 - yRate)),
    0
  );
  const chi2 = Math.max(0, 2 * (llModel - llNull));
  const pModel = 1 - chiDistCDF(chi2, 1);
  const accuracy = probs.filter((p, i) => (p >= 0.5 ? 1 : 0) === ys[i]).length / n;

  let h00 = 0,
    h01 = 0,
    h11 = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.max(1e-6, probs[i] * (1 - probs[i]));
    h00 += w;
    h01 += w * zx[i];
    h11 += w * zx[i] * zx[i];
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
      conclusion:
        pModel < 0.05 ? "模型整体显著，自变量可显著预测二分类结果。" : "模型整体未达到显著水平。",
      interpretation: `二元 Logistic 回归使用标准化自变量预测二分类因变量。模型似然比检验 χ²(1) = ${chi2.toFixed(
        2
      )}，p ${pModel < 0.001 ? "< .001" : `= ${pModel.toFixed(3)}`}；自变量 OR = ${oddsRatio.toFixed(
        2
      )}，分类准确率 ${(accuracy * 100).toFixed(1)}%。`,
    }),
  };
}
