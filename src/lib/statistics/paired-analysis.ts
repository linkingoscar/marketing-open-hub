import { runPearson, runSpearman } from "./tests/correlation";
import { runRegression } from "./tests/regression";

type PairedAnalysis = "pearson" | "spearman" | "regression";

/** Keep only finite numeric pairs from the same original row, without coercing missing values. */
export function completeNumericPairs(
  rows: ReadonlyArray<Record<string, unknown>>,
  colA: string,
  colB: string
): { x: number[]; y: number[] } {
  const x: number[] = [],
    y: number[] = [];
  for (const row of rows) {
    const a = row[colA],
      b = row[colB];
    if (
      typeof a === "number" &&
      Number.isFinite(a) &&
      typeof b === "number" &&
      Number.isFinite(b)
    ) {
      x.push(a);
      y.push(b);
    }
  }
  return { x, y };
}

/** Shared file-data path for the workspace's correlation and single-predictor regression. */
export function runPairedAnalysis(
  test: PairedAnalysis,
  rows: ReadonlyArray<Record<string, unknown>>,
  colA: string,
  colB: string
) {
  if (!colA || !colB) {
    throw new Error(test === "regression" ? "请指定因变量列和至少一个自变量列" : "请指定两列数值");
  }
  const { x, y } = completeNumericPairs(rows, colA, colB);
  const minimum = test === "regression" ? 5 : 3;
  if (x.length < minimum) throw new Error(`需要至少 ${minimum} 个配对观测`);
  if (test === "pearson") return runPearson(x, y);
  if (test === "spearman") return runSpearman(x, y);
  return runRegression(
    x.map((value) => [value]),
    y
  );
}
