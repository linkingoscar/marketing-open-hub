"use client";

/**
 * 构念自动识别引擎
 * 从 CSV 列名中按命名规则自动分组
 * 例如: purchase_1, purchase_2, purchase_3 → "purchase" 构念
 *       brand_trust_1, brand_trust_2 → "brand_trust" 构念
 *       age, gender, income → 人口统计学变量（不分组）
 */

export interface VariableItem {
  name: string;
  type: "ordinal" | "continuous" | "categorical" | "demographic";
  values: number[];
  mean: number;
  sd: number;
  min: number;
  max: number;
  missing: number;
}

export interface Construct {
  id: string;
  name: string;
  displayName: string;
  items: VariableItem[];
  color: string;
  meanScore: number[];
}

// 构念颜色池
const CONSTRUCT_COLORS = [
  "#6366F1", "#06B6D4", "#F59E0B", "#EC4899", "#10B981",
  "#EF4444", "#8B5CF6", "#14B8A6", "#F97316", "#3B82F6",
];

// 人口统计学关键词
const DEMO_PATTERNS = [
  /^(age|gender|sex|income|education|occupation|marital|region|city|country|race|ethnicity|nationality)$/i,
  /^(年龄|性别|收入|教育|职业|婚姻|地区|城市|国家|民族)$/i,
  /^(q\d+)$/i, // Q1, Q2 等问卷编号（如果没有下划线后缀）
];

function isDemographic(name: string): boolean {
  return DEMO_PATTERNS.some((p) => p.test(name));
}

function extractConstructName(colName: string): string | null {
  // Pattern 1: name_number (e.g., purchase_1, brand_trust_2)
  const match1 = colName.match(/^(.+?)[-_](\d+)$/);
  if (match1) return match1[1].toLowerCase().replace(/[-\s]/g, "_");

  // Pattern 2: nameItem_number (e.g., Trust_Item1, BrandTrust2)
  const match2 = colName.match(/^([a-zA-Z]+?)[_]?Item[_]?(\d+)$/i);
  if (match2) return match2[1].toLowerCase();

  // Pattern 3: camelCase with number (e.g., brandTrust1, purchaseIntent3)
  const match3 = colName.match(/^([a-z]+(?:[A-Z][a-z]+)*?)(\d+)$/);
  if (match3) return match3[1].replace(/([A-Z])/g, "_$1").toLowerCase();

  // Pattern 4: Q1, Q2, Q3... (questionnaire items)
  const match4 = colName.match(/^Q(\d+)$/i);
  if (match4) return null; // Too ambiguous, treat as ungrouped

  // Pattern 5: Chinese + number (品牌信任_1, 购买意愿2)
  const match5 = colName.match(/^(.+?)[_\s]?(\d+)$/);
  if (match5 && /[\u4e00-\u9fa5]/.test(match5[1])) return match5[1].trim();

  return null;
}

function prettifyName(name: string): string {
  return name
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function calcStats(values: number[]): { mean: number; sd: number; min: number; max: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, sd: 0, min: 0, max: 0 };
  const m = values.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, n - 1));
  return { mean: +m.toFixed(2), sd: +sd.toFixed(2), min: values.reduce((min, v) => Math.min(min, v), Infinity), max: values.reduce((max, v) => Math.max(max, v), -Infinity) };
}

export function autoDetectConstructs(
  headers: string[],
  rows: Record<string, string | number>[]
): { constructs: Construct[]; demographics: VariableItem[]; ungrouped: VariableItem[] } {
  const constructMap = new Map<string, string[]>(); // constructName -> item column names
  const ungroupedCols: string[] = [];
  const demoCols: string[] = [];

  for (const col of headers) {
    if (isDemographic(col)) {
      demoCols.push(col);
      continue;
    }
    const constructName = extractConstructName(col);
    if (constructName) {
      if (!constructMap.has(constructName)) constructMap.set(constructName, []);
      constructMap.get(constructName)!.push(col);
    } else {
      ungroupedCols.push(col);
    }
  }

  // Only keep constructs with 2+ items
  const constructs: Construct[] = [];
  let colorIdx = 0;
  for (const [name, cols] of constructMap) {
    if (cols.length < 2) {
      ungroupedCols.push(...cols);
      continue;
    }
    const items: VariableItem[] = cols.map((col) => {
      const values = rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");
      const stats = calcStats(values);
      const isLikert = values.length > 0 && values.every((v) => Number.isInteger(v) && v >= 1 && v <= 7);
      return {
        name: col,
        type: isLikert ? "ordinal" as const : "continuous" as const,
        values,
        ...stats,
        missing: rows.length - values.length,
      };
    });
    const _allValues = items.flatMap((i) => i.values);
    constructs.push({
      id: name,
      name,
      displayName: prettifyName(name),
      items,
      color: CONSTRUCT_COLORS[colorIdx % CONSTRUCT_COLORS.length],
      meanScore: Array.from({ length: rows.length }, (_, i) =>
        items.reduce((s, item) => s + (item.values[i] ?? 0), 0) / items.length
      ),
    });
    colorIdx++;
  }

  const demographics: VariableItem[] = demoCols.map((col) => {
    const values = rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");
    const stats = calcStats(values);
    return { name: col, type: "demographic", values, ...stats, missing: rows.length - values.length };
  });

  const ungrouped: VariableItem[] = ungroupedCols.map((col) => {
    const values = rows.map((r) => r[col]).filter((v): v is number => typeof v === "number");
    const stats = calcStats(values);
    const isLikert = values.length > 0 && values.every((v) => Number.isInteger(v) && v >= 1 && v <= 7);
    return {
      name: col,
      type: isLikert ? "ordinal" as const : values.length > 0 ? "continuous" as const : "categorical" as const,
      values,
      ...stats,
      missing: rows.length - values.length,
    };
  });

  return { constructs, demographics, ungrouped };
}
