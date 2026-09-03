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
import {
  type TestType,
  type APAReport,
  TESTS,
  CATEGORIES,
  formatAPAText,
  runDescriptive,
  runItemAnalysis,
  runLikertFreq,
  runShapiroWilk,
  pStars,
  runLevene,
  runTTest,
  runPairedTTest,
  runAnova,
  runRepeatedMeasuresAnova,
  runANCOVA,
  runMANOVA,
  runMannWhitney,
  runWilcoxon,
  runKruskalWallis,
  runFriedman,
  runChiSquare,
  runFisherExact,
  runPearson,
  runSpearman,
  runRegression,
  runLogistic,
  runCronbach,
  runSplitHalf,
  runCRAVE,
  runHTMT,
  runCFA,
  runCMV,
  runEFA,
  runMediation,
  runModeration,
  runPower,
  runBayesTTest,
  runBayesCorrelation,
  runConjoint,
  runMaxDiff,
  runEffectSize,
  completeRepeatedMatrix,
} from "@/lib/statistics";

/* ========== Component ========== */
export default function StatisticsPage() {
  const [selectedTest, setSelectedTest] = useState<TestType>("descriptive");
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [colA, setColA] = useState("");
  const [colB, setColB] = useState("");
  const [groupCol, setGroupCol] = useState("");
  const [result, setResult] = useState<{
    stats: Record<string, number | string>;
    apa: APAReport;
  } | null>(null);
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
        const getNumCol = (col: string) =>
          rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");

        switch (selectedTest) {
          case "descriptive": {
            const nums = getNumCol(colA);
            if (nums.length < 2) {
              setError("需要至少 2 个数值");
              return;
            }
            setResult(runDescriptive(nums));
            break;
          }
          case "normality": {
            const nums = getNumCol(colA);
            if (nums.length < 3) {
              setError("需要至少 3 个数值");
              return;
            }
            setResult(runShapiroWilk(nums));
            break;
          }
          case "homogeneity": {
            if (!groupCol || !colA) {
              setError("请指定分组列和数值列");
              return;
            }
            const groups = [...new Set(rows.map((r) => String(r[groupCol])))].map((g) =>
              rows
                .filter((r) => String(r[groupCol]) === g)
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number")
            );
            if (groups.length < 2) {
              setError("需要至少 2 组");
              return;
            }
            setResult(runLevene(groups));
            break;
          }
          case "ttest": {
            let g1: number[], g2: number[];
            if (groupCol) {
              const groups = [...new Set(rows.map((r) => String(r[groupCol])))];
              if (groups.length < 2) {
                setError("分组列需要至少 2 个不同值");
                return;
              }
              g1 = rows
                .filter((r) => String(r[groupCol]) === groups[0])
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number");
              g2 = rows
                .filter((r) => String(r[groupCol]) === groups[1])
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number");
            } else {
              if (!colA || !colB) {
                setError("请指定两列数值或一个分组列");
                return;
              }
              g1 = getNumCol(colA);
              g2 = getNumCol(colB);
            }
            if (g1.length < 2 || g2.length < 2) {
              setError("每组需要至少 2 个数值");
              return;
            }
            setResult(runTTest(g1, g2));
            break;
          }
          case "mann-whitney": {
            let g1: number[], g2: number[];
            if (groupCol) {
              const groups = [...new Set(rows.map((r) => String(r[groupCol])))];
              if (groups.length < 2) {
                setError("分组列需要至少 2 个不同值");
                return;
              }
              g1 = rows
                .filter((r) => String(r[groupCol]) === groups[0])
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number");
              g2 = rows
                .filter((r) => String(r[groupCol]) === groups[1])
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number");
            } else {
              if (!colA || !colB) {
                setError("请指定两列数值或一个分组列");
                return;
              }
              g1 = getNumCol(colA);
              g2 = getNumCol(colB);
            }
            setResult(runMannWhitney(g1, g2));
            break;
          }
          case "wilcoxon": {
            if (!colA || !colB) {
              setError("请指定配对的两列");
              return;
            }
            const pairs: [number, number][] = [];
            for (const row of rows) {
              const a = row[colA],
                b = row[colB];
              if (typeof a === "number" && typeof b === "number") pairs.push([a, b]);
            }
            if (pairs.length < 5) {
              setError("需要至少 5 个配对观测");
              return;
            }
            setResult(runWilcoxon(pairs));
            break;
          }
          case "paired-ttest": {
            if (!colA || !colB) {
              setError("请指定配对的两列（如前测/后测）");
              return;
            }
            const before: number[] = [],
              after: number[] = [];
            for (const row of rows) {
              const a = row[colA],
                b = row[colB];
              if (typeof a === "number" && typeof b === "number") {
                before.push(a);
                after.push(b);
              }
            }
            if (before.length < 3) {
              setError("需要至少 3 个配对观测");
              return;
            }
            setResult(runPairedTTest(before, after));
            break;
          }
          case "likert-freq": {
            const likertCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (likertCols.length < 1) {
              setError("需要至少 1 个数值列");
              return;
            }
            const items = likertCols.map((col) =>
              rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
            );
            const minLen = Math.min(...items.map((i) => i.length));
            const itemMatrix = items.map((col) => col.slice(0, minLen));
            setResult(runLikertFreq(itemMatrix));
            break;
          }
          case "item-analysis": {
            const itemCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (itemCols.length < 3) {
              setError("项目分析需要至少 3 个量表题项列");
              return;
            }
            const getItems = (cols: string[]) => {
              const items = cols.map((col) =>
                rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
              );
              const minLen = Math.min(...items.map((i) => i.length));
              return items.map((col) => col.slice(0, minLen));
            };
            const groupEntries = Object.entries(constructGroups).filter(
              ([, items]) => items.length >= 3
            );
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
                  df: "",
                  p: "",
                  effect: "",
                  ci: "",
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
            if (!groupCol || !colA) {
              setError("请指定分组列和数值列");
              return;
            }
            const groups = [...new Set(rows.map((r) => String(r[groupCol])))].map((g) =>
              rows
                .filter((r) => String(r[groupCol]) === g)
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number")
            );
            if (groups.length < 2) {
              setError("需要至少 2 组");
              return;
            }
            setResult(runAnova(groups));
            break;
          }
          case "kruskal-wallis": {
            if (!groupCol || !colA) {
              setError("请指定分组列和数值列");
              return;
            }
            const groups = [...new Set(rows.map((r) => String(r[groupCol])))].map((g) =>
              rows
                .filter((r) => String(r[groupCol]) === g)
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number")
            );
            if (groups.length < 2) {
              setError("需要至少 2 组");
              return;
            }
            setResult(runKruskalWallis(groups));
            break;
          }
          case "repeated-anova": {
            const measureCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (measureCols.length < 2) {
              setError("重复测量 ANOVA 需要至少 2 个数值测量列");
              return;
            }
            const matrix = completeRepeatedMatrix(rows, measureCols);
            if (matrix.length < 3) {
              setError("需要至少 3 行完整重复测量数据");
              return;
            }
            setResult(runRepeatedMeasuresAnova(matrix, measureCols));
            break;
          }
          case "friedman": {
            const measureCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (measureCols.length < 2) {
              setError("Friedman 检验需要至少 2 个数值测量列");
              return;
            }
            const matrix = completeRepeatedMatrix(rows, measureCols);
            if (matrix.length < 3) {
              setError("需要至少 3 行完整重复测量数据");
              return;
            }
            setResult(runFriedman(matrix, measureCols));
            break;
          }
          case "ancova": {
            if (!groupCol || !colA || !colB) {
              setError("请指定协变量(X)、因变量(Y)和分组列(G)");
              return;
            }
            const complete = rows
              .map((r) => ({ cov: r[colA], y: r[colB], group: String(r[groupCol]) }))
              .filter(
                (r): r is { cov: number; y: number; group: string } =>
                  typeof r.cov === "number" && typeof r.y === "number" && r.group.length > 0
              );
            const groups = [...new Set(complete.map((r) => r.group))];
            if (complete.length < 8 || groups.length < 2) {
              setError("ANCOVA 需要至少 2 组和 8 个完整观测");
              return;
            }
            setResult(
              runANCOVA(
                complete.map((r) => r.y),
                complete.map((r) => r.cov),
                complete.map((r) => r.group)
              )
            );
            break;
          }
          case "manova": {
            if (!groupCol) {
              setError("MANOVA 需要选择分组列(G)");
              return;
            }
            const outcomeCols = fileData.headers
              .filter((h) => h !== groupCol && rows.some((r) => typeof r[h] === "number"))
              .slice(0, 6);
            if (outcomeCols.length < 2) {
              setError("MANOVA 需要至少 2 个数值因变量列");
              return;
            }
            const levels = [...new Set(rows.map((r) => String(r[groupCol])).filter(Boolean))];
            const grouped = levels
              .map((level) =>
                rows
                  .filter((r) => String(r[groupCol]) === level)
                  .map((r) => outcomeCols.map((col) => r[col]))
                  .filter((values): values is number[] =>
                    values.every((value) => typeof value === "number" && Number.isFinite(value))
                  )
              )
              .filter((group) => group.length >= 2);
            if (grouped.length < 2) {
              setError("MANOVA 需要至少 2 组，每组至少 2 个完整观测");
              return;
            }
            setResult(runMANOVA(grouped, outcomeCols));
            break;
          }
          case "chi-square": {
            if (!colA || !colB) {
              setError("请指定两个分类列");
              return;
            }
            const catsA = [...new Set(rows.map((r) => String(r[colA])))];
            const catsB = [...new Set(rows.map((r) => String(r[colB])))];
            const table = catsA.map((a) =>
              catsB.map(
                (b) => rows.filter((r) => String(r[colA]) === a && String(r[colB]) === b).length
              )
            );
            if (table.length < 2 || table[0].length < 2) {
              setError("需要至少 2×2 列联表");
              return;
            }
            setResult(runChiSquare(table));
            break;
          }
          case "fisher": {
            if (!colA || !colB) {
              setError("请指定两个分类列");
              return;
            }
            const catsA = [...new Set(rows.map((r) => String(r[colA])))];
            const catsB = [...new Set(rows.map((r) => String(r[colB])))];
            const table = catsA.map((a) =>
              catsB.map(
                (b) => rows.filter((r) => String(r[colA]) === a && String(r[colB]) === b).length
              )
            );
            if (table.length !== 2 || table[0].length !== 2) {
              setError("Fisher 精确检验需要 2×2 表");
              return;
            }
            setResult(runFisherExact(table));
            break;
          }
          case "pearson": {
            if (!colA || !colB) {
              setError("请指定两列数值");
              return;
            }
            const x = getNumCol(colA),
              y = getNumCol(colB);
            const minLen = Math.min(x.length, y.length);
            if (minLen < 3) {
              setError("需要至少 3 个配对观测");
              return;
            }
            setResult(runPearson(x.slice(0, minLen), y.slice(0, minLen)));
            break;
          }
          case "spearman": {
            if (!colA || !colB) {
              setError("请指定两列数值");
              return;
            }
            const x = getNumCol(colA),
              y = getNumCol(colB);
            const minLen = Math.min(x.length, y.length);
            if (minLen < 3) {
              setError("需要至少 3 个配对观测");
              return;
            }
            setResult(runSpearman(x.slice(0, minLen), y.slice(0, minLen)));
            break;
          }
          case "regression": {
            if (!colA || !colB) {
              setError("请指定因变量列和至少一个自变量列");
              return;
            }
            const y = getNumCol(colB);
            const xVars: number[][] = [];
            const _numCols = fileData.headers.filter(
              (h) => h !== colB && rows.some((r) => typeof r[colA] === "number")
            );
            // Use colA as the single predictor for simplicity; multiple predictors via multiple selection
            const xCol = getNumCol(colA);
            const minLen = Math.min(y.length, xCol.length);
            if (minLen < 5) {
              setError("需要至少 5 个观测");
              return;
            }
            for (let i = 0; i < minLen; i++) xVars.push([xCol[i]]);
            setResult(runRegression(xVars, y.slice(0, minLen)));
            break;
          }
          case "logistic": {
            if (!colA || !colB) {
              setError("请指定自变量(X)和二分类因变量(Y)");
              return;
            }
            const complete = rows
              .map((r) => ({ x: r[colA], y: r[colB] }))
              .filter(
                (r): r is { x: number; y: string | number } => typeof r.x === "number" && r.y !== ""
              );
            const classes = [...new Set(complete.map((r) => String(r.y)))];
            if (complete.length < 10 || classes.length !== 2) {
              setError("Logistic 回归需要 1 个数值自变量和恰好 2 类因变量，且至少 10 个完整观测");
              return;
            }
            const y = complete.map((r) => (String(r.y) === classes[1] ? 1 : 0));
            setResult(
              runLogistic(
                complete.map((r) => r.x),
                y
              )
            );
            break;
          }
          case "cronbach": {
            const numCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (numCols.length < 2) {
              setError("需要至少 2 个数值列作为量表题项");
              return;
            }
            const getItems = (cols: string[]) => {
              const items = cols.map((col) =>
                rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
              );
              const minLen = Math.min(...items.map((i) => i.length));
              return { items: items.map((col) => col.slice(0, minLen)), labels: cols };
            };
            const groupEntries = Object.entries(constructGroups).filter(
              ([, items]) => items.length >= 2
            );
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
                  statistic: results
                    .map(
                      (r) => `${r.construct}: α = ${(r.stats.Cronbach_alpha as number).toFixed(3)}`
                    )
                    .join("; "),
                  df: "",
                  p: "",
                  effect: "",
                  ci: "",
                  conclusion: results
                    .map(
                      (r) =>
                        `${r.construct}: α = ${(r.stats.Cronbach_alpha as number).toFixed(3)} ${r.apa.conclusion}`
                    )
                    .join("\n"),
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
            if (!colA) {
              setError("请指定数值列");
              return;
            }
            if (groupCol) {
              const groups = [...new Set(rows.map((r) => String(r[groupCol])))];
              if (groups.length >= 2) {
                const g1 = rows
                  .filter((r) => String(r[groupCol]) === groups[0])
                  .map((r) => r[colA])
                  .filter((v): v is number => typeof v === "number");
                const g2 = rows
                  .filter((r) => String(r[groupCol]) === groups[1])
                  .map((r) => r[colA])
                  .filter((v): v is number => typeof v === "number");
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
            const numCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (numCols.length < 2) {
              setError("需要至少 2 个数值列作为量表题项");
              return;
            }
            const getItems = (cols: string[]) => {
              const items = cols.map((col) =>
                rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
              );
              const minLen = Math.min(...items.map((i) => i.length));
              return { items: items.map((col) => col.slice(0, minLen)), labels: cols };
            };
            const groupEntries = Object.entries(constructGroups).filter(
              ([, items]) => items.length >= 2
            );
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
                  statistic: results
                    .map(
                      (r) =>
                        `${r.construct}: CR=${(r.stats.CR as number).toFixed(3)}, AVE=${(r.stats.AVE as number).toFixed(3)}`
                    )
                    .join("; "),
                  df: "",
                  p: "",
                  effect: "",
                  ci: "",
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
            const numCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (numCols.length < 4) {
              setError("HTMT 需要至少 4 个题项（2 个构念各 2 题）");
              return;
            }

            let constructArray: { name: string; items: number[][] }[] = [];

            // Use manual construct groups if available
            const groupEntries = Object.entries(constructGroups).filter(
              ([, items]) => items.length >= 2
            );
            if (groupEntries.length >= 2) {
              const minLen = Math.min(
                ...numCols.map((col) => rows.filter((r) => typeof r[col] === "number").length)
              );
              constructArray = groupEntries.map(([name, cols]) => ({
                name,
                items: cols.map((col) =>
                  rows
                    .map((r) => r[col])
                    .filter((v): v is number => typeof v === "number")
                    .slice(0, minLen)
                ),
              }));
            } else {
              // Fallback: auto-split in half
              const half = Math.ceil(numCols.length / 2);
              const cols1 = numCols.slice(0, half),
                cols2 = numCols.slice(half);
              const items1 = cols1.map((col) =>
                rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
              );
              const items2 = cols2.map((col) =>
                rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
              );
              const minLen = Math.min(
                ...items1.map((i) => i.length),
                ...items2.map((i) => i.length)
              );
              constructArray = [
                { name: "构念A", items: items1.map((col) => col.slice(0, minLen)) },
                { name: "构念B", items: items2.map((col) => col.slice(0, minLen)) },
              ];
            }
            setResult(runHTMT(constructArray));
            break;
          }
          case "efa": {
            const numCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (numCols.length < 3) {
              setError("EFA 需要至少 3 个测量题项列");
              return;
            }
            const items = numCols.map((col) =>
              rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
            );
            const minLen = Math.min(...items.map((i) => i.length));
            if (minLen < 5) {
              setError("EFA 需要至少 5 个完整观测");
              return;
            }
            setResult(
              runEFA(
                items.map((col) => col.slice(0, minLen)),
                numCols
              )
            );
            break;
          }
          case "cfa": {
            const numCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (numCols.length < 3) {
              setError("CFA 需要至少 3 个测量指标");
              return;
            }
            const items = numCols.map((col) =>
              rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
            );
            const minLen = Math.min(...items.map((i) => i.length));
            const itemMatrix = items.map((col) => col.slice(0, minLen));
            setResult(runCFA(itemMatrix, numCols));
            break;
          }
          case "cmv": {
            const numCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (numCols.length < 3) {
              setError("Harman 检验需要至少 3 个题项");
              return;
            }
            const items = numCols.map((col) =>
              rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
            );
            const minLen = Math.min(...items.map((i) => i.length));
            const itemMatrix = items.map((col) => col.slice(0, minLen));
            setResult(runCMV(itemMatrix));
            break;
          }
          case "mediation": {
            if (!colA || !colB) {
              setError("请指定自变量(X)列和因变量(Y)列");
              return;
            }
            if (!groupCol) {
              setError("请在'分组列'中选择中介变量(M)列");
              return;
            }
            const X = getNumCol(colA),
              M = getNumCol(groupCol),
              Y = getNumCol(colB);
            const minLen = Math.min(X.length, M.length, Y.length);
            if (minLen < 10) {
              setError("中介分析需要至少 10 个观测");
              return;
            }
            setResult(runMediation(X.slice(0, minLen), M.slice(0, minLen), Y.slice(0, minLen)));
            break;
          }
          case "moderation": {
            if (!colA || !colB) {
              setError("请指定自变量(X)列和因变量(Y)列");
              return;
            }
            if (!groupCol) {
              setError("请在'分组列'中选择调节变量(W)列");
              return;
            }
            const X = getNumCol(colA),
              W = getNumCol(groupCol),
              Y = getNumCol(colB);
            const minLen = Math.min(X.length, W.length, Y.length);
            if (minLen < 10) {
              setError("调节分析需要至少 10 个观测");
              return;
            }
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
              if (groups.length < 2) {
                setError("分组列需要至少 2 个不同值");
                return;
              }
              g1 = rows
                .filter((r) => String(r[groupCol]) === groups[0])
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number");
              g2 = rows
                .filter((r) => String(r[groupCol]) === groups[1])
                .map((r) => r[colA])
                .filter((v): v is number => typeof v === "number");
            } else {
              if (!colA || !colB) {
                setError("请指定两列数值或一个分组列");
                return;
              }
              g1 = getNumCol(colA);
              g2 = getNumCol(colB);
            }
            if (g1.length < 3 || g2.length < 3) {
              setError("每组需要至少 3 个数值");
              return;
            }
            setResult(runBayesTTest(g1, g2));
            break;
          }
          case "bayes-correlation": {
            if (!colA || !colB) {
              setError("请指定两列数值");
              return;
            }
            const x = getNumCol(colA),
              y = getNumCol(colB);
            const minLen = Math.min(x.length, y.length);
            if (minLen < 5) {
              setError("需要至少 5 个配对观测");
              return;
            }
            setResult(runBayesCorrelation(x.slice(0, minLen), y.slice(0, minLen)));
            break;
          }
          case "split-half": {
            const itemCols = fileData.headers.filter((h) =>
              rows.some((r) => typeof r[h] === "number")
            );
            if (itemCols.length < 4) {
              setError("分半信度需要至少 4 个题项");
              return;
            }
            const items = itemCols.map((col) =>
              rows.map((r) => r[col]).filter((v): v is number => typeof v === "number")
            );
            const minLen = Math.min(...items.map((i) => i.length));
            setResult(runSplitHalf(items.map((col) => col.slice(0, minLen))));
            break;
          }
          case "conjoint": {
            if (!colA || !colB) {
              setError("请指定评分列(Y)和至少一个属性列(X)");
              return;
            }
            const ratingCol = colB;
            const attrCols = [colA, ...(groupCol ? [groupCol] : [])];
            setResult(runConjoint(rows, ratingCol, attrCols));
            break;
          }
          case "maxdiff": {
            if (!colA || !colB) {
              setError("请指定'最好'列和'最差'列");
              return;
            }
            setResult(runMaxDiff(rows, colA, colB));
            break;
          }
        }
      } else if (manualInput.trim()) {
        const nums = manualInput
          .split(/[\n,;\s]+/)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (nums.length < 2) {
          setError("至少需要 2 个数值");
          return;
        }
        setResult(runDescriptive(nums));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "计算错误");
    }
  };

  const numCols = fileData
    ? fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number"))
    : [];
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
        <Link
          href="/workspace"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#A855F7]/10 flex items-center justify-center text-xl">
            🧮
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">统计分析工具箱</h1>
            <p className="text-sm text-[var(--text-muted)]">
              基于 market-research-stats-toolkit · 学术实证级 · 纯浏览器端计算
            </p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">
          上传数据 → 查看变量画布 → 选择分析方法 → 查看结果
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Upload + Variables */}
          <div className="space-y-4">
            <FileUpload
              onUpload={handleFileUpload}
              description="CSV / TSV 文件，第一行为列名（支持中文变量名）"
            />

            {fileData && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {fileData.fileName}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {fileData.rowCount} 行 × {fileData.colCount} 列
                  </Badge>
                </div>

                {/* Variable Canvas — all variables as interactive bubbles */}
                <div>
                  <span className="text-xs text-[var(--text-muted)] mb-2 block">
                    📊 变量画布（点击选择分析列）
                  </span>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/50 min-h-[80px]">
                    {fileData.headers.map((h) => {
                      const isNum = fileData.rows.some((r) => typeof r[h] === "number");
                      const isA = colA === h;
                      const isB = colB === h;
                      const isGroup = groupCol === h;
                      const role = isA ? "A" : isB ? "B" : isGroup ? "G" : null;
                      const roleColor = isA
                        ? "#6366F1"
                        : isB
                          ? "#06B6D4"
                          : isGroup
                            ? "#F59E0B"
                            : undefined;
                      return (
                        <motion.button
                          key={h}
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
                            role
                              ? "text-white font-medium"
                              : isNum
                                ? "border-[#3B82F6]/30 text-[#3B82F6] hover:border-[#3B82F6]/60"
                                : "border-[#F59E0B]/30 text-[#F59E0B] hover:border-[#F59E0B]/60"
                          )}
                          style={
                            role ? { background: roleColor, borderColor: roleColor } : undefined
                          }
                          title={`${h} (${isNum ? "数值" : "分类"})${role ? ` → ${role === "A" ? "变量A" : role === "B" ? "变量B" : "分组"}` : " · 点击选择"}`}
                        >
                          {role && (
                            <span className="mr-1 opacity-70">
                              {role === "A" ? "X" : role === "B" ? "Y" : "G"}:
                            </span>
                          )}
                          {h}
                          {role && <span className="ml-1 opacity-70">×</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-[var(--text-muted)]">
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#3B82F6] mr-1" />{" "}
                      数值变量
                    </span>
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1" />{" "}
                      分类变量
                    </span>
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#6366F1] mr-1" /> X
                      (选中)
                    </span>
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#06B6D4] mr-1" /> Y
                      (选中)
                    </span>
                    <span>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1" /> G
                      (分组)
                    </span>
                  </div>
                </div>

                {/* Construct Grouper for scale analyses */}
                {["htmt", "cfa", "cronbach", "item-analysis", "cr-ave", "efa", "cmv"].includes(
                  selectedTest
                ) && (
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
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTest(t.id);
                              setResult(null);
                              setError("");
                            }}
                            className={cn(
                              "px-2 py-1 rounded-lg text-[11px] border transition-all flex items-center gap-1.5",
                              selectedTest === t.id
                                ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10"
                                : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            )}
                            title={`${t.label} - ${t.desc} (${t.validationLevel === "validated" ? "已对拍验证" : t.validationLevel === "experimental" ? "探索性指标" : "Beta 测试中"})`}
                          >
                            <span>{t.label}</span>
                            {t.validationLevel === "validated" && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                                title="已完成基准验证"
                              />
                            )}
                            {t.validationLevel === "experimental" && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"
                                title="探索性启发式方法"
                              />
                            )}
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
              <SmartSuggest
                headers={fileData.headers}
                rows={fileData.rows}
                currentTest={selectedTest}
                onSuggest={(id) => {
                  setSelectedTest(id as TestType);
                  setResult(null);
                  setError("");
                }}
              />
            )}

            {/* History */}
            <HistoryPanel tool="statistics" />

            {/* Data Profile */}
            {fileData && <DataProfileDashboard headers={fileData.headers} rows={fileData.rows} />}

            {/* Manual input for descriptive */}
            {!fileData && selectedTest === "descriptive" && (
              <div>
                <label className="text-sm text-[var(--text-tertiary)] mb-2 block">
                  或手动输入数值
                </label>
                <Textarea
                  rows={5}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="每行一个数值或逗号分隔"
                  className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none font-mono text-sm"
                />
              </div>
            )}

            {error && <div className="text-sm text-[var(--error)] px-2">{error}</div>}

            <Button
              onClick={handleRun}
              disabled={
                (!fileData && !manualInput.trim()) ||
                (fileData !== null && selectedTest !== "descriptive" && !colA)
              }
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90"
            >
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      const blob = new Blob([formatAPAText(result.apa)], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `stats-${selectedTest}-${Date.now()}.txt`;
                      a.click();
                    }}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {result && (
              <>
                {/* APA formatted conclusion */}
                <div className="glass-card p-5 border-[var(--primary)]/20 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-sm font-semibold text-[var(--primary)]">
                        APA 格式报告
                      </span>
                    </div>
                    {currentTest && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          currentTest.validationLevel === "validated"
                            ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                            : currentTest.validationLevel === "experimental"
                              ? "text-amber-600 border-amber-500/30 bg-amber-500/10"
                              : "text-blue-600 border-blue-500/30 bg-blue-500/10"
                        )}
                      >
                        {currentTest.validationLevel === "validated"
                          ? "✓ 已对拍验证"
                          : currentTest.validationLevel === "experimental"
                            ? "⚠ 探索性指标"
                            : "🧪 Beta"}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">检验方法：</span>
                      <span className="text-[var(--text-primary)]">{result.apa.test}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">统计量：</span>
                      <span className="text-[var(--text-primary)] font-mono">
                        {result.apa.statistic}
                      </span>
                    </div>
                    {result.apa.df && (
                      <div>
                        <span className="text-[var(--text-muted)]">自由度：</span>
                        <span className="text-[var(--text-primary)] font-mono">
                          {result.apa.df}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-[var(--text-muted)]">显著性：</span>
                      <span
                        className={cn(
                          "font-mono",
                          result.apa.p.includes("< .001") ||
                            (result.apa.p.startsWith("= ") &&
                              parseFloat(result.apa.p.slice(2)) < 0.05)
                            ? "text-[var(--success)]"
                            : "text-[var(--text-primary)]"
                        )}
                      >
                        p {result.apa.p}
                      </span>
                      {result.apa.p && (
                        <span className="ml-2 text-xs">
                          {pStars(
                            result.apa.p.includes("<") ? 0.001 : parseFloat(result.apa.p.slice(2))
                          )}
                        </span>
                      )}
                    </div>
                    {result.apa.effect && (
                      <div>
                        <span className="text-[var(--text-muted)]">效应量：</span>
                        <span className="text-[var(--text-primary)]">{result.apa.effect}</span>
                      </div>
                    )}
                    {result.apa.ci && (
                      <div>
                        <span className="text-[var(--text-muted)]">置信区间：</span>
                        <span className="text-[var(--text-primary)] font-mono">
                          {result.apa.ci}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conclusion box */}
                  <div className="mt-3 p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                    <span className="text-xs font-medium text-[var(--primary)] block mb-1">
                      结论
                    </span>
                    <p className="text-sm text-[var(--text-secondary)]">{result.apa.conclusion}</p>
                  </div>

                  {/* Full interpretation */}
                  <div className="mt-2">
                    <span className="text-xs font-medium text-[var(--text-muted)] block mb-1">
                      完整解释
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {result.apa.interpretation}
                    </p>
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
                    <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">
                      📊 数据可视化
                    </span>
                    <div className="space-y-4">
                      {/* Distribution chart for the primary variable */}
                      {(() => {
                        const nums = fileData.rows
                          .map((r) => r[colA])
                          .filter((v): v is number => typeof v === "number");
                        if (
                          nums.length >= 5 &&
                          [
                            "descriptive",
                            "normality",
                            "ttest",
                            "paired-ttest",
                            "mann-whitney",
                            "wilcoxon",
                            "anova",
                            "kruskal-wallis",
                            "regression",
                            "pearson",
                            "spearman",
                            "effect-size",
                            "cronbach",
                            "item-analysis",
                            "likert-freq",
                          ].includes(selectedTest)
                        ) {
                          return (
                            <ChartExportWrapper filename={`${colA}-distribution`}>
                              <DistributionChart
                                data={nums}
                                title={`${colA} 分布`}
                                color="#6366F1"
                              />
                            </ChartExportWrapper>
                          );
                        }
                        return null;
                      })()}

                      {/* Scatter plot for correlation/regression */}
                      {["pearson", "spearman", "regression"].includes(selectedTest) &&
                        colB &&
                        (() => {
                          const x = fileData.rows
                            .map((r) => r[colA])
                            .filter((v): v is number => typeof v === "number");
                          const y = fileData.rows
                            .map((r) => r[colB])
                            .filter((v): v is number => typeof v === "number");
                          const minLen = Math.min(x.length, y.length);
                          if (minLen >= 5) {
                            return (
                              <ChartExportWrapper filename={`${colA}-vs-${colB}-scatter`}>
                                <ScatterPlot
                                  x={x.slice(0, minLen)}
                                  y={y.slice(0, minLen)}
                                  xLabel={colA}
                                  yLabel={colB}
                                  title={`${colA} vs ${colB} 散点图`}
                                  showRegression={
                                    selectedTest === "regression" || selectedTest === "pearson"
                                  }
                                />
                              </ChartExportWrapper>
                            );
                          }
                          return null;
                        })()}

                      {/* Box plot for group comparisons */}
                      {["ttest", "mann-whitney", "anova", "kruskal-wallis"].includes(
                        selectedTest
                      ) &&
                        groupCol &&
                        (() => {
                          const groups = [
                            ...new Set(fileData.rows.map((r) => String(r[groupCol]))),
                          ];
                          const groupData = groups
                            .map((g) => ({
                              label: g,
                              data: fileData.rows
                                .filter((r) => String(r[groupCol]) === g)
                                .map((r) => r[colA])
                                .filter((v): v is number => typeof v === "number"),
                            }))
                            .filter((g) => g.data.length >= 2);
                          if (groupData.length >= 2) {
                            return (
                              <ChartExportWrapper filename={`${colA}-boxplot`}>
                                <BoxPlotChart groups={groupData} title={`${colA} 各组分布对比`} />
                              </ChartExportWrapper>
                            );
                          }
                          return null;
                        })()}

                      {/* Correlation heatmap for multi-item scales */}
                      {["cronbach", "item-analysis", "efa", "cr-ave", "htmt", "cfa"].includes(
                        selectedTest
                      ) &&
                        (() => {
                          const numCols = fileData.headers.filter((h) =>
                            fileData.rows.some((r) => typeof r[h] === "number")
                          );
                          if (numCols.length >= 3 && numCols.length <= 15) {
                            const items = numCols.map((col) =>
                              fileData.rows
                                .map((r) => r[col])
                                .filter((v): v is number => typeof v === "number")
                            );
                            const minLen = Math.min(...items.map((i) => i.length));
                            // Correlation matrix
                            const matrix: number[][] = [];
                            for (let i = 0; i < items.length; i++) {
                              matrix[i] = [];
                              for (let j = 0; j < items.length; j++) {
                                if (i === j) {
                                  matrix[i][j] = 1;
                                  continue;
                                }
                                const a = items[i].slice(0, minLen),
                                  b = items[j].slice(0, minLen);
                                const ma = a.reduce((s, v) => s + v, 0) / minLen;
                                const mb = b.reduce((s, v) => s + v, 0) / minLen;
                                let num = 0,
                                  d1 = 0,
                                  d2 = 0;
                                for (let k = 0; k < minLen; k++) {
                                  const da = a[k] - ma,
                                    db = b[k] - mb;
                                  num += da * db;
                                  d1 += da * da;
                                  d2 += db * db;
                                }
                                matrix[i][j] = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
                              }
                            }
                            const labels = numCols.map((c) =>
                              c.length > 8 ? c.slice(0, 7) + "…" : c
                            );
                            return (
                              <ChartExportWrapper filename="correlation-heatmap">
                                <Heatmap
                                  matrix={matrix}
                                  rowLabels={labels}
                                  colLabels={labels}
                                  title="题项相关矩阵热力图"
                                />
                              </ChartExportWrapper>
                            );
                          }
                          return null;
                        })()}

                      {/* Fallback: show distribution for descriptive if no specific chart */}
                      {selectedTest === "descriptive" &&
                        !colB &&
                        (() => {
                          const nums = fileData.rows
                            .map((r) => r[colA])
                            .filter((v): v is number => typeof v === "number");
                          if (nums.length >= 5) {
                            return (
                              <DistributionChart
                                data={nums}
                                title={`${colA} 频率分布`}
                                bins={Math.min(15, Math.max(5, Math.ceil(Math.sqrt(nums.length))))}
                                color="#06B6D4"
                              />
                            );
                          }
                          return null;
                        })()}
                    </div>
                  </div>
                )}

                {/* Results Exporter */}
                <ResultsExporter
                  testLabel={currentTest.label}
                  apa={result.apa}
                  stats={result.stats}
                />

                {/* Raw stats */}
                <div className="glass-card p-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">
                    详细统计量
                  </span>
                  <div className="space-y-1">
                    {Object.entries(result.stats).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-1 border-b border-[var(--border)] last:border-b-0"
                      >
                        <span className="text-xs text-[var(--text-tertiary)]">{key}</span>
                        <span className="text-xs font-mono text-[var(--text-primary)]">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Item details table (for cronbach, item-analysis, likert-freq) */}
                {"itemDetails" in result &&
                  Array.isArray(result.itemDetails) &&
                  result.itemDetails.length > 0 && (
                    <div className="glass-card p-4">
                      <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">
                        题项分析详情
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)]">
                              {Object.keys(result.itemDetails[0]).map((key) => (
                                <th
                                  key={key}
                                  className="text-left py-2 px-2 text-[var(--text-muted)] font-medium whitespace-nowrap"
                                >
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.itemDetails.map(
                              (row: Record<string, string | number>, i: number) => (
                                <tr key={i} className="border-b border-[var(--border)]">
                                  {Object.values(row).map((val, j) => (
                                    <td
                                      key={j}
                                      className="py-2 px-2 text-[var(--text-secondary)] font-mono whitespace-nowrap"
                                    >
                                      {String(val)}
                                    </td>
                                  ))}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Likert frequency table */}
                {"freqTable" in result &&
                  Array.isArray(result.freqTable) &&
                  result.freqTable.length > 0 && (
                    <div className="glass-card p-4">
                      <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">
                        Likert 频率分布
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)]">
                              {Object.keys(result.freqTable[0]).map((key) => (
                                <th
                                  key={key}
                                  className="text-center py-2 px-2 text-[var(--text-muted)] font-medium whitespace-nowrap"
                                >
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.freqTable.map((row: Record<string, number>, i: number) => (
                              <tr key={i} className="border-b border-[var(--border)]">
                                {Object.values(row).map((val, j) => (
                                  <td
                                    key={j}
                                    className="text-center py-2 px-2 text-[var(--text-secondary)] font-mono"
                                  >
                                    {typeof val === "number"
                                      ? Number.isInteger(val)
                                        ? val
                                        : val.toFixed(1)
                                      : val}
                                  </td>
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
