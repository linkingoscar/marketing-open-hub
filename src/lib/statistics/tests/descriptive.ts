import { mean, median, stddev, se, skewness, kurtosis, q, variance, normalCDF } from "../math";
import { formatAPA } from "../formatters/apa";
import type { APAReport } from "../types";

export function runDescriptive(nums: number[]): { stats: Record<string, number>; apa: APAReport } {
  const n = nums.length;
  const m = mean(nums);
  const sd = stddev(nums);
  const seVal = se(nums);
  const sk = skewness(nums);
  const ku = kurtosis(nums);
  const stats = {
    N: n,
    Mean: +m.toFixed(4),
    SD: +sd.toFixed(4),
    Variance: +variance(nums).toFixed(4),
    SE: +seVal.toFixed(4),
    Median: +median(nums).toFixed(4),
    Min: nums.length ? Math.min(...nums) : 0,
    Max: nums.length ? Math.max(...nums) : 0,
    Q1: +q(nums, 0.25).toFixed(4),
    Q3: +q(nums, 0.75).toFixed(4),
    Skewness: +sk.toFixed(4),
    Kurtosis: +ku.toFixed(4),
  };
  const apa = formatAPA({
    title: "描述性统计",
    test: "描述性统计",
    statistic: `M = ${m.toFixed(2)}, SD = ${sd.toFixed(2)}, SE = ${seVal.toFixed(2)}`,
    conclusion: `共 ${n} 个有效观测值。偏度 ${sk.toFixed(2)}（${Math.abs(sk) < 1 ? "近似对称" : sk > 0 ? "右偏" : "左偏"}），峰度 ${ku.toFixed(2)}（${Math.abs(ku) < 1 ? "近似正态" : ku > 0 ? "尖峰" : "平峰"}）`,
    interpretation: `数据集中趋势为 ${m.toFixed(2)}，离散程度 SD = ${sd.toFixed(2)}，四分位距 IQR = ${(q(nums, 0.75) - q(nums, 0.25)).toFixed(2)}。`,
  });
  return { stats, apa };
}

export function runItemAnalysis(items: number[][]): {
  stats: Record<string, number | string>;
  apa: APAReport;
  itemDetails: Record<string, string | number>[];
} {
  const n = items[0].length;
  const k = items.length;
  const totalScores = Array.from({ length: n }, (_, i) => items.reduce((s, row) => s + row[i], 0));
  const sortedTotal = [...totalScores].sort((a, b) => a - b);
  const cutoff27 = sortedTotal[Math.floor(n * 0.27)];
  const cutoff73 = sortedTotal[Math.floor(n * 0.73)];
  const lowGroup = new Set<number>();
  const highGroup = new Set<number>();
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
    const mLow = mean(lowScores);
    const mHigh = mean(highScores);
    const sLow = variance(lowScores);
    const sHigh = variance(highScores);
    const pooledSE = Math.sqrt(
      sLow / Math.max(1, lowScores.length) + sHigh / Math.max(1, highScores.length)
    );
    const t = pooledSE > 0 ? (mHigh - mLow) / pooledSE : 0;
    const p = 2 * (1 - normalCDF(Math.abs(t)));

    // Corrected item-total correlation
    const otherTotals = Array.from({ length: n }, (_, j) =>
      items.reduce((s, row, idx) => (idx === i ? s : s + row[j]), 0)
    );
    const itemMean = mean(itemScores);
    const otherMean = mean(otherTotals);
    let num = 0;
    let dx2 = 0;
    let dy2 = 0;
    for (let j = 0; j < n; j++) {
      const dx = itemScores[j] - itemMean;
      const dy = otherTotals[j] - otherMean;
      num += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    const rit = dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : 0;
    itemDetails.push({
      item: `Item ${i + 1}`,
      mean: +mean(itemScores).toFixed(2),
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
  const stats: Record<string, number | string> = {
    total_items: k,
    valid_n: n,
    good_items: goodItems,
    needs_revision: k - goodItems,
  };
  const apa = formatAPA({
    title: "项目分析",
    test: "极端组比较 + 校正项-总计相关",
    statistic: `${goodItems}/${k} 题项鉴别度良好`,
    conclusion: `项目分析（27% 极端组法）显示 ${goodItems} 个题项鉴别度良好（CR 显著且 r_it > .3），${k - goodItems} 个题项可能需要修改。`,
    interpretation: `采用 27% 极端组法进行项目分析。高分组（n = ${highGroup.size}）与低分组（n = ${lowGroup.size}）在各题项上的差异经独立样本 t 检验验证。校正项-总计相关系数 > .30 表示题项具有良好的区分度。`,
  });
  return { stats, apa, itemDetails };
}

export function runLikertFreq(items: number[][]): {
  stats: Record<string, number>;
  apa: APAReport;
  freqTable: Record<string, number>[];
} {
  const n = items[0].length;
  const k = items.length;
  const allValues = items.flat();
  const minVal = allValues.length ? Math.min(...allValues) : 1;
  const maxVal = allValues.length ? Math.max(...allValues) : 5;
  const levels = Array.from({ length: Math.max(1, maxVal - minVal + 1) }, (_, i) => minVal + i);

  const freqTable: Record<string, number>[] = [];
  for (let i = 0; i < k; i++) {
    const freq: Record<string, number> = {};
    for (const lv of levels) freq[`${lv}`] = 0;
    for (const v of items[i]) freq[`${v}`] = (freq[`${v}`] || 0) + 1;
    const total = items[i].length;
    const row: Record<string, number> = {};
    for (const lv of levels) {
      const count = freq[`${lv}`];
      row[`freq_${lv}`] = count;
      row[`pct_${lv}`] = total > 0 ? +((count / total) * 100).toFixed(1) : 0;
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
    interpretation: `各题项的均值范围 ${Math.min(...freqTable.map((r) => r.mean)).toFixed(2)}–${Math.max(...freqTable.map((r) => r.mean)).toFixed(2)}，标准差范围 ${Math.min(...freqTable.map((r) => r.sd)).toFixed(2)}–${Math.max(...freqTable.map((r) => r.sd)).toFixed(2)}。`,
  });
  return { stats, apa, freqTable };
}
