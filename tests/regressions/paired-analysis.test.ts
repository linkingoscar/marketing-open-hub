import { describe, expect, it } from "vitest";
import { completeNumericPairs, runPairedAnalysis } from "@/lib/statistics/paired-analysis";
import { runPearson, runSpearman, runRegression } from "@/lib/statistics";

const completeRows = [
  { x: 1, y: 3 },
  { x: 2, y: 4 },
  { x: 3, y: 8 },
  { x: 4, y: 7 },
  { x: 5, y: 11 },
];
const rowsWithGaps = [
  completeRows[0],
  { x: "", y: 999 },
  completeRows[1],
  { x: -999, y: "" },
  completeRows[2],
  { x: "invalid", y: 123 },
  completeRows[3],
  { x: 456, y: "invalid" },
  completeRows[4],
];

describe("completeNumericPairs", () => {
  it("preserves original row alignment when the columns have different missing rows", () => {
    expect(completeNumericPairs(rowsWithGaps, "x", "y")).toEqual({
      x: [1, 2, 3, 4, 5],
      y: [3, 4, 8, 7, 11],
    });
  });
  it("drops an entire pair for blank, invalid, or non-finite cells without coercion", () => {
    const invalid = ["", " ", "12", "n/a", null, undefined, NaN, Infinity, -Infinity, true];
    const rows = [
      ...invalid.map((value) => ({ x: value, y: 99 })),
      ...invalid.map((value) => ({ x: 99, y: value })),
      {},
      { x: 0, y: -2 },
      { x: 0, y: -2 },
      { x: -1, y: 0 },
    ];
    expect(completeNumericPairs(rows, "x", "y")).toEqual({ x: [0, 0, -1], y: [-2, -2, 0] });
  });
  it("does not mutate rows and uses only the selected columns", () => {
    const rows = Object.freeze([Object.freeze({ predictor: 1, outcome: 2, ignored: NaN })]);
    expect(completeNumericPairs(rows, "predictor", "outcome")).toEqual({ x: [1], y: [2] });
    expect(completeNumericPairs(rows, "missing", "outcome")).toEqual({ x: [], y: [] });
  });
});

describe("workspace paired-analysis path", () => {
  it("runs Pearson on jointly complete rows", () => {
    expect(runPairedAnalysis("pearson", rowsWithGaps, "x", "y")).toEqual(
      runPearson([1, 2, 3, 4, 5], [3, 4, 8, 7, 11])
    );
  });
  it("runs Spearman on jointly complete rows", () => {
    expect(runPairedAnalysis("spearman", rowsWithGaps, "x", "y")).toEqual(
      runSpearman([1, 2, 3, 4, 5], [3, 4, 8, 7, 11])
    );
  });
  it("runs regression with each response matched to its original predictor", () => {
    const result = runPairedAnalysis("regression", rowsWithGaps, "x", "y");
    expect(result).toEqual(runRegression([[1], [2], [3], [4], [5]], [3, 4, 8, 7, 11]));
    expect(result.stats["β1"]).toBeCloseTo(1.9, 4);
    expect(result.stats.intercept).toBeCloseTo(0.9, 4);
    expect(result.stats.df_residual).toBe(3);
  });
  for (const test of ["pearson", "spearman", "regression"] as const) {
    const minimum = test === "regression" ? 5 : 3;
    it(`${test} counts complete pairs, not separately valid column lengths`, () => {
      const rows = [
        ...completeRows.slice(0, minimum - 1),
        { x: "", y: 6 },
        { x: 6, y: "" },
        { x: NaN, y: 7 },
        { x: 7, y: Infinity },
      ];
      expect(() => runPairedAnalysis(test, rows, "x", "y")).toThrow(`至少 ${minimum} 个配对观测`);
      expect(() => runPairedAnalysis(test, [], "x", "y")).toThrow(`至少 ${minimum} 个配对观测`);
    });
    it(`${test} accepts exactly the minimum complete sample`, () => {
      expect(() => runPairedAnalysis(test, completeRows.slice(0, minimum), "x", "y")).not.toThrow();
    });
    it(`${test} requires two selected columns`, () => {
      expect(() => runPairedAnalysis(test, completeRows, "", "y")).toThrow(/请指定/);
      expect(() => runPairedAnalysis(test, completeRows, "x", "")).toThrow(/请指定/);
    });
    it(`${test} ignores unrelated invalid cells`, () => {
      const rows = completeRows.map((row) => ({ ...row, unrelated: NaN }));
      expect(runPairedAnalysis(test, rows, "x", "y")).toEqual(
        runPairedAnalysis(test, completeRows, "x", "y")
      );
    });
  }
});
