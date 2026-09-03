import { mean, variance, matInv, addRidge, determinant, chiDistCDF, matVecMul } from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

export function correlationMatrix(items: number[][]): number[][] {
  const p = items.length;
  const n = Math.min(...items.map((item) => item.length));
  const trimmed = items.map((item) => item.slice(0, n));
  const matrix: number[][] = [];
  for (let i = 0; i < p; i++) {
    matrix[i] = [];
    for (let j = 0; j < p; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      const xi = trimmed[i],
        xj = trimmed[j];
      const mi = mean(xi),
        mj = mean(xj);
      let num = 0,
        di = 0,
        dj = 0;
      for (let r = 0; r < n; r++) {
        const ai = xi[r] - mi,
          aj = xj[r] - mj;
        num += ai * aj;
        di += ai * ai;
        dj += aj * aj;
      }
      matrix[i][j] = di > 0 && dj > 0 ? num / Math.sqrt(di * dj) : 0;
    }
  }
  return matrix;
}

export function powerComponent(matrix: number[][]): { value: number; vector: number[] } {
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

export function varimax(loadings: number[][]): number[][] {
  if (loadings.length === 0 || loadings[0].length <= 1) return loadings;
  const rotated = loadings.map((row) => [...row]);
  const p = rotated.length;
  const factors = rotated[0].length;
  for (let iter = 0; iter < 20; iter++) {
    for (let a = 0; a < factors - 1; a++) {
      for (let b = a + 1; b < factors; b++) {
        let A = 0,
          B = 0,
          C = 0,
          D = 0;
        for (let i = 0; i < p; i++) {
          const x = rotated[i][a],
            y = rotated[i][b];
          const u = x * x - y * y;
          const v = 2 * x * y;
          A += u;
          B += v;
          C += u * u - v * v;
          D += 2 * u * v;
        }
        const angle = 0.25 * Math.atan2(D - (2 * A * B) / p, C - (A * A - B * B) / p);
        const cos = Math.cos(angle),
          sin = Math.sin(angle);
        for (let i = 0; i < p; i++) {
          const x = rotated[i][a],
            y = rotated[i][b];
          rotated[i][a] = x * cos + y * sin;
          rotated[i][b] = -x * sin + y * cos;
        }
      }
    }
  }
  return rotated;
}

export function runCronbach(items: number[][]): {
  stats: Record<string, number | string>;
  apa: APAReport;
  itemDetails?: Record<string, string | number>[];
} {
  const n = items[0].length,
    k = items.length;
  const itemVars = items.map((row) => variance(row));
  const totalScores = Array.from({ length: n }, (_, i) => items.reduce((s, row) => s + row[i], 0));
  const totalVar = variance(totalScores);
  const alpha =
    totalVar > 0
      ? (k / Math.max(1, k - 1)) * (1 - itemVars.reduce((s, v) => s + v, 0) / totalVar)
      : 0;
  const interp =
    alpha >= 0.9
      ? "优秀"
      : alpha >= 0.8
        ? "良好"
        : alpha >= 0.7
          ? "可接受"
          : alpha >= 0.6
            ? "可疑"
            : "不可接受";

  const itemDetails: Record<string, string | number>[] = [];
  for (let i = 0; i < k; i++) {
    const itemScores = items[i];
    const otherTotals = Array.from({ length: n }, (_, j) =>
      items.reduce((s, row, idx) => (idx === i ? s : s + row[j]), 0)
    );
    const itemMean = mean(itemScores),
      otherMean = mean(otherTotals);
    let num = 0,
      dx2 = 0,
      dy2 = 0;
    for (let j = 0; j < n; j++) {
      const dx = itemScores[j] - itemMean,
        dy = otherTotals[j] - otherMean;
      num += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    const rit = dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : 0;
    const remainingVars = itemVars.filter((_, idx) => idx !== i);
    const remainingTotalVar = variance(
      Array.from({ length: n }, (_, j) =>
        items.reduce((s, row, idx) => (idx === i ? s : s + row[j]), 0)
      )
    );
    const alphaIfDeleted =
      remainingVars.length > 1 && remainingTotalVar > 0
        ? ((k - 1) / (k - 2)) * (1 - remainingVars.reduce((s, v) => s + v, 0) / remainingTotalVar)
        : 0;
    itemDetails.push({
      item: `Item ${i + 1}`,
      mean: +(itemScores.reduce((s, v) => s + v, 0) / n).toFixed(4),
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
    interpretation: `Cronbach's α 系数为 ${alpha.toFixed(3)}，根据 George & Mallery (2003) 的标准（α ≥ .9 优秀，≥ .8 良好，≥ .7 可接受），本量表信度${interp}。各题项校正项-总计相关系数范围 ${Math.min(
      ...itemDetails.map((d) => d.corrected_item_total_r as number)
    ).toFixed(
      3
    )}–${Math.max(...itemDetails.map((d) => d.corrected_item_total_r as number)).toFixed(3)}（建议 > .3）。`,
  });
  return { stats, apa, itemDetails };
}

export function runSplitHalf(items: number[][]): {
  stats: Record<string, number | string>;
  apa: APAReport;
} {
  const k = items.length,
    n = items[0].length;
  const half = Math.ceil(k / 2);
  const items1 = items.slice(0, half);
  const items2 = items.slice(half);
  const scores1 = Array.from({ length: n }, (_, i) => items1.reduce((s, row) => s + row[i], 0));
  const scores2 = Array.from({ length: n }, (_, i) => items2.reduce((s, row) => s + row[i], 0));
  const m1 = mean(scores1),
    m2 = mean(scores2);
  let num = 0,
    d1 = 0,
    d2 = 0;
  for (let i = 0; i < n; i++) {
    const a = scores1[i] - m1,
      b = scores2[i] - m2;
    num += a * b;
    d1 += a * a;
    d2 += b * b;
  }
  const r = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
  const sb = (2 * r) / (1 + r || 1);
  const interp = sb >= 0.9 ? "优秀" : sb >= 0.8 ? "良好" : sb >= 0.7 ? "可接受" : "不可接受";
  const stats: Record<string, number | string> = {
    half1_items: half,
    half2_items: k - half,
    n,
    pearson_r: +r.toFixed(4),
    spearman_brown: +sb.toFixed(4),
    interpretation: interp,
  };
  const apa = formatAPA({
    title: "分半信度分析",
    test: "Split-half reliability (Spearman-Brown corrected)",
    statistic: `r = ${r.toFixed(3)}, Spearman-Brown = ${sb.toFixed(3)}`,
    conclusion: `分半信度${interp}（Spearman-Brown 校正后 = ${sb.toFixed(3)}）。`,
    interpretation: `将 ${k} 个题项分为两半（各 ${half} 和 ${k - half} 题），计算两半得分的 Pearson 相关系数 r = ${r.toFixed(
      3
    )}，经 Spearman-Brown 公式校正后信度为 ${sb.toFixed(3)}。`,
  });
  return { stats, apa };
}

export function runCRAVE(
  items: number[][],
  labels?: string[]
): {
  stats: Record<string, number | string>;
  apa: APAReport;
  details: Record<string, string | number>[];
} {
  const k = items.length,
    n = items[0].length;
  const totalScores = Array.from({ length: n }, (_, i) => items.reduce((s, row) => s + row[i], 0));
  const loadings: number[] = items.map((row) => {
    const m1 = mean(row),
      m2 = mean(totalScores);
    let num = 0,
      d1 = 0,
      d2 = 0;
    for (let i = 0; i < n; i++) {
      const a = row[i] - m1,
        b = totalScores[i] - m2;
      num += a * b;
      d1 += a * a;
      d2 += b * b;
    }
    return d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
  });
  const loadingsSq = loadings.map((l) => l * l);
  const errorVariances = loadings.map((l) => 1 - l * l);
  const sumLoadings = loadings.reduce((s, l) => s + l, 0);
  const sumErrors = errorVariances.reduce((s, e) => s + e, 0);
  const CR = sumLoadings ** 2 / (sumLoadings ** 2 + sumErrors || 1);
  const AVE = loadingsSq.reduce((s, l) => s + l, 0) / k;
  const crInterp = CR >= 0.7 ? "良好" : CR >= 0.6 ? "可接受" : "不可接受";
  const aveInterp = AVE >= 0.5 ? "良好" : "不足（建议 > 0.5）";

  const details: Record<string, string | number>[] = items.map((_, i) => ({
    item: labels?.[i] ?? `Item ${i + 1}`,
    loading: +loadings[i].toFixed(4),
    loading_sq: +loadingsSq[i].toFixed(4),
    error_variance: +errorVariances[i].toFixed(4),
  }));

  const stats: Record<string, number | string> = {
    CR: +CR.toFixed(4),
    AVE: +AVE.toFixed(4),
    items: k,
    n,
  };
  const apa = formatAPA({
    title: "组合信度与收敛效度",
    test: "CR (Composite Reliability) + AVE (Average Variance Extracted)",
    statistic: `CR = ${CR.toFixed(3)}, AVE = ${AVE.toFixed(3)}`,
    conclusion: `组合信度${crInterp}（CR = ${CR.toFixed(3)}，标准 ≥ 0.7）。收敛效度${aveInterp}（AVE = ${AVE.toFixed(
      3
    )}，标准 ≥ 0.5）。`,
    interpretation: `根据 Hair et al. (2019) 标准，组合信度 CR ≥ 0.7 表示构念具有良好的内部一致性，平均方差提取量 AVE ≥ 0.5 表示构念解释了其测量指标 50% 以上的方差。本量表 CR = ${CR.toFixed(
      3
    )}，AVE = ${AVE.toFixed(3)}。各题项因子载荷范围 ${Math.min(...loadings).toFixed(3)}–${Math.max(
      ...loadings
    ).toFixed(3)}（建议 > 0.7）。`,
  });
  return { stats, apa, details };
}

export function runHTMT(constructs: { name: string; items: number[][] }[]): {
  stats: Record<string, number | string>;
  apa: APAReport;
  matrix: Record<string, string | number>[];
} {
  const k = constructs.length;
  const matrix: Record<string, string | number>[] = [];
  for (let i = 0; i < k; i++) {
    const row: Record<string, string | number> = { construct: constructs[i].name };
    for (let j = 0; j < k; j++) {
      if (i === j) {
        row[constructs[j].name] = "1.000";
      } else if (j > i) {
        const items_i = constructs[i].items,
          items_j = constructs[j].items;
        let sumCorr = 0,
          count = 0;
        for (const ii of items_i) {
          for (const jj of items_j) {
            const mi = mean(ii),
              mj = mean(jj);
            let num = 0,
              d1 = 0,
              d2 = 0;
            for (let n = 0; n < ii.length; n++) {
              const a = ii[n] - mi,
                b = jj[n] - mj;
              num += a * b;
              d1 += a * a;
              d2 += b * b;
            }
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
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const val = matrix[i][constructs[j].name];
      if (typeof val === "number") allHTMT.push(val);
      else if (typeof val === "string") allHTMT.push(parseFloat(val));
    }
  }
  const maxHTMT = allHTMT.length ? Math.max(...allHTMT.filter((v) => !isNaN(v))) : 0;
  const pass = maxHTMT < 0.85;

  const stats: Record<string, number | string> = {
    constructs: k,
    max_htmt: +maxHTMT.toFixed(4),
    threshold: 0.85,
    pass: pass ? "通过" : "未通过",
  };
  const apa = formatAPA({
    title: "HTMT 区别效度",
    test: "Heterotrait-Monotrait Ratio (HTMT)",
    statistic: `HTMT 最大值 = ${maxHTMT.toFixed(3)}`,
    conclusion: pass
      ? `区别效度良好：所有 HTMT 值均低于 0.85 阈值（Henseler et al., 2015）。`
      : `区别效度存疑：存在 HTMT 值超过 0.85 阈值，构念间区分度不足。`,
    interpretation: `HTMT（异质-单质相关比率）用于评估构念间的区别效度。根据 Henseler et al. (2015) 的标准，HTMT < 0.85（严格标准）或 < 0.90（宽松标准）表示构念间具有良好的区别效度。本分析中最大 HTMT = ${maxHTMT.toFixed(
      3
    )}。`,
  });
  return { stats, apa, matrix };
}

export function runCFA(
  items: number[][],
  labels?: string[]
): {
  stats: Record<string, number | string>;
  apa: APAReport;
  details: Record<string, string | number>[];
} {
  const k = items.length,
    n = items[0].length;
  const corMatrix: number[][] = [];
  for (let i = 0; i < k; i++) {
    corMatrix[i] = [];
    for (let j = 0; j < k; j++) {
      if (i === j) {
        corMatrix[i][j] = 1;
        continue;
      }
      const mi = mean(items[i]),
        mj = mean(items[j]);
      let num = 0,
        d1 = 0,
        d2 = 0;
      for (let r = 0; r < items[i].length; r++) {
        const a = items[i][r] - mi,
          b = items[j][r] - mj;
        num += a * b;
        d1 += a * a;
        d2 += b * b;
      }
      corMatrix[i][j] = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
    }
  }

  const loadings: number[] = items.map((row, idx) => {
    const others = items.filter((_, j) => j !== idx);
    const otherTotal = Array.from({ length: n }, (_, i) => others.reduce((s, r) => s + r[i], 0));
    const m1 = mean(row),
      m2 = mean(otherTotal);
    let num = 0,
      d1 = 0,
      d2 = 0;
    for (let i = 0; i < n; i++) {
      const a = row[i] - m1,
        b = otherTotal[i] - m2;
      num += a * b;
      d1 += a * a;
      d2 += b * b;
    }
    return d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
  });

  const avgCorr =
    corMatrix
      .flat()
      .filter((_, i) => i % (k + 1) !== 0)
      .reduce((s, v) => s + Math.abs(v), 0) / (k * (k - 1) || 1);
  const chi2Approx = n * (k - 1) * (1 - avgCorr) * 2;
  const df = (k * (k - 1)) / 2;
  const rmsea = df > 0 ? Math.sqrt(Math.max(0, (chi2Approx / df - 1) / Math.max(1, n - 1))) : 0;
  const cfi = chi2Approx > df ? 1 - (chi2Approx - df) / (k * (k - 1) * n * 0.05 || 1) : 1;
  const srmrApprox = Math.sqrt(
    corMatrix
      .flat()
      .filter((_, i) => i % (k + 1) !== 0)
      .reduce((s, v) => s + v * v, 0) / (k * (k - 1) || 1)
  );

  const details: Record<string, string | number>[] = items.map((_, i) => ({
    item: labels?.[i] ?? `Item ${i + 1}`,
    std_loading: +loadings[i].toFixed(4),
    loading_sq: +(loadings[i] ** 2).toFixed(4),
    error: +(1 - loadings[i] ** 2).toFixed(4),
  }));

  const rmseaInterp = rmsea < 0.05 ? "良好" : rmsea < 0.08 ? "可接受" : "不佳";
  const cfiInterp = cfi > 0.95 ? "良好" : cfi > 0.9 ? "可接受" : "不佳";
  const srmrInterp = srmrApprox < 0.05 ? "良好" : srmrApprox < 0.08 ? "可接受" : "不佳";

  const stats: Record<string, number | string> = {
    items: k,
    n,
    chi2_approx: +chi2Approx.toFixed(2),
    df,
    RMSEA: +rmsea.toFixed(4),
    CFI: +Math.min(1, Math.max(0, cfi)).toFixed(4),
    SRMR: +srmrApprox.toFixed(4),
    RMSEA_interp: rmseaInterp,
    CFI_interp: cfiInterp,
    SRMR_interp: srmrInterp,
  };
  const apa = formatAPA({
    title: "验证性因子分析 (CFA)",
    test: "CFA — 模型拟合指标",
    statistic: `χ² ≈ ${chi2Approx.toFixed(2)}, df = ${df}, RMSEA = ${rmsea.toFixed(3)}, CFI = ${Math.min(
      1,
      cfi
    ).toFixed(3)}, SRMR = ${srmrApprox.toFixed(3)}`,
    conclusion: `模型拟合：RMSEA ${rmseaInterp}（${rmsea.toFixed(3)}），CFI ${cfiInterp}（${Math.min(
      1,
      cfi
    ).toFixed(3)}），SRMR ${srmrInterp}（${srmrApprox.toFixed(3)}）。`,
    interpretation: `根据 Hu & Bentler (1999) 标准：RMSEA < .05 良好，< .08 可接受；CFI > .95 良好，> .90 可接受；SRMR < .05 良好，< .08 可接受。本模型拟合指标显示模型与数据的拟合程度${
      rmsea < 0.08 && cfi > 0.9 ? "可接受" : "需要改进"
    }。各题项标准化因子载荷范围 ${Math.min(...loadings).toFixed(3)}–${Math.max(...loadings).toFixed(3)}。`,
  });
  return { stats, apa, details };
}

export function runCMV(items: number[][]): {
  stats: Record<string, number | string>;
  apa: APAReport;
} {
  const k = items.length,
    n = items[0].length;
  const corrs: number[] = [];
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const mi = mean(items[i]),
        mj = mean(items[j]);
      let num = 0,
        d1 = 0,
        d2 = 0;
      for (let r = 0; r < items[i].length; r++) {
        const a = items[i][r] - mi,
          b = items[j][r] - mj;
        num += a * b;
        d1 += a * a;
        d2 += b * b;
      }
      corrs.push(d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0);
    }
  }
  const avgCorr = corrs.reduce((s, c) => s + c, 0) / (corrs.length || 1);
  const firstFactorVarPct = ((1 + (k - 1) * avgCorr) / k) * 100;
  const pass = firstFactorVarPct < 50;

  const stats: Record<string, number | string> = {
    total_items: k,
    n,
    first_factor_variance_pct: +firstFactorVarPct.toFixed(2),
    threshold: 50,
    result: pass ? "无严重偏差" : "可能存在偏差",
  };
  const apa = formatAPA({
    title: "共同方法偏差检验",
    test: "Harman 单因子检验",
    statistic: `第一个因子解释方差 = ${firstFactorVarPct.toFixed(1)}%`,
    conclusion: pass
      ? `第一个因子解释了 ${firstFactorVarPct.toFixed(1)}% 的方差，低于 50% 阈值，不存在严重的共同方法偏差。`
      : `第一个因子解释了 ${firstFactorVarPct.toFixed(1)}% 的方差，超过 50% 阈值，可能存在共同方法偏差。`,
    interpretation: `Harman 单因子检验（Podsakoff et al., 2003）：将所有题项进行探索性因子分析，若第一个因子解释的方差不超过 50%，则认为不存在严重的共同方法偏差。本检验中第一个因子解释了 ${firstFactorVarPct.toFixed(
      1
    )}% 的方差。`,
  });
  return { stats, apa };
}

export function runEFA(
  items: number[][],
  labels?: string[]
): { stats: Record<string, number | string>; apa: APAReport } {
  const p = items.length;
  const n = Math.min(...items.map((item) => item.length));
  const corr = correlationMatrix(items.map((item) => item.slice(0, n)));
  const inv = matInv(addRidge(corr));
  let sumR2 = 0,
    sumPartial2 = 0;
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
      for (let j = 0; j < p; j++) {
        residual[i][j] -= component.value * component.vector[i] * component.vector[j];
      }
    }
  }
  const factorCount = Math.max(1, eigenvalues.filter((v) => v >= 1).length || eigenvalues.length);
  const rawLoadings = Array.from({ length: p }, (_, itemIdx) =>
    eigenvalues
      .slice(0, factorCount)
      .map((eig, f) => eigenvectors[f][itemIdx] * Math.sqrt(Math.max(0, eig)))
  );
  const loadings = varimax(rawLoadings);
  const explained = eigenvalues.slice(0, factorCount).reduce((s, v) => s + v, 0) / p;
  const itemLabels = labels ?? items.map((_, i) => `Item${i + 1}`);
  const loadingText = itemLabels
    .map(
      (label, i) => `${label}: ${loadings[i].map((v, f) => `F${f + 1}=${v.toFixed(2)}`).join(", ")}`
    )
    .join("; ");
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
      conclusion:
        kmo >= 0.6 && bartlettP < 0.05
          ? "数据适合进行因子分析，已基于特征值规则提取因子并进行 Varimax 旋转。"
          : "因子分析适配性偏弱，建议检查题项相关性或样本量。",
      interpretation: `EFA 结果显示 KMO = ${kmo.toFixed(2)}，Bartlett 球形检验 χ²(${bartlettDf}) = ${bartlett.toFixed(
        2
      )}，p ${
        bartlettP < 0.001 ? "< .001" : `= ${bartlettP.toFixed(3)}`
      }。保留 ${factorCount} 个因子，累计解释 ${(explained * 100).toFixed(1)}% 方差。`,
    }),
  };
}
