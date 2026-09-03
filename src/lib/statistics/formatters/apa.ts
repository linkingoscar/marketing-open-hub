import type { APAReport } from "../types";

/**
 * 格式化并补全 APA 报告对象
 */
export function formatAPA(partial: Partial<APAReport>): APAReport {
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

/**
 * 将 APAReport 转换为易于复制或导出的纯文本字符串
 */
export function formatAPAText(apa: APAReport): string {
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
