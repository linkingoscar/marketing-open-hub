"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { cn } from "@/lib/utils";

const METHODS = [
  { id: "uplift", label: "Uplift 建模", desc: "S/T/X-Learner + CATE 估计", color: "#6366F1", needsAI: false },
  { id: "did", label: "双重差分 (DiD)", desc: "干预前后+对照组因果效应", color: "#06B6D4", needsAI: false },
  { id: "scm", label: "合成控制法", desc: "构建反事实基准线", color: "#F59E0B", needsAI: false },
  { id: "granger", label: "Granger 因果检验", desc: "时间序列因果关系检验", color: "#EC4899", needsAI: false },
  { id: "causal-ai", label: "AI 因果分析", desc: "LLM 辅助因果推断与解释", color: "#10B981", needsAI: true },
];

function runUplift(data: Record<string, number>[], treatmentCol: string, outcomeCol: string, featureCols: string[]) {
  const treated = data.filter((r) => r[treatmentCol] === 1);
  const control = data.filter((r) => r[treatmentCol] === 0);
  if (treated.length === 0 || control.length === 0) {
    throw new Error("Uplift 建模需要处理变量包含 0 和 1 两组");
  }
  const ate = treated.reduce((s, r) => s + r[outcomeCol], 0) / treated.length - control.reduce((s, r) => s + r[outcomeCol], 0) / control.length;

  const featureImpacts: Record<string, number> = {};
  for (const f of featureCols) {
    const highT = treated.filter((r) => r[f] > treated.reduce((s, x) => s + x[f], 0) / treated.length);
    const highC = control.filter((r) => r[f] > control.reduce((s, x) => s + x[f], 0) / control.length);
    if (highT.length > 0 && highC.length > 0) {
      featureImpacts[f] = (highT.reduce((s, r) => s + r[outcomeCol], 0) / highT.length) - (highC.reduce((s, r) => s + r[outcomeCol], 0) / highC.length);
    }
  }

  return {
    ate: +ate.toFixed(4),
    treated_n: treated.length,
    control_n: control.length,
    treated_mean: +(treated.reduce((s, r) => s + r[outcomeCol], 0) / treated.length).toFixed(4),
    control_mean: +(control.reduce((s, r) => s + r[outcomeCol], 0) / control.length).toFixed(4),
    feature_impacts: featureImpacts,
    interpretation: `ATE = ${ate.toFixed(4)}（处理组均值 ${treated.reduce((s, r) => s + r[outcomeCol], 0) / treated.length} vs 对照组 ${control.reduce((s, r) => s + r[outcomeCol], 0) / control.length}）。处理组有 ${treated.length} 个样本，对照组 ${control.length} 个。`,
  };
}

function toNum(value: string | number): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function classifyTreatment(value: string | number): boolean {
  if (typeof value === "number") return value > 0;
  return /^(1|true|yes|y|treat|treated|treatment|post|实验|处理|干预)$/i.test(value.trim());
}

function classifyPost(value: string | number, allValues: (string | number)[]): boolean {
  if (typeof value === "string" && /(post|after|后|之后|干预后|1|true|yes)$/i.test(value.trim())) return true;
  const numeric = allValues.map(toNum).filter((v): v is number => v !== null);
  const currentNum = toNum(value);
  if (numeric.length > 0 && currentNum !== null) {
    const sorted = [...numeric].sort((a, b) => a - b);
    return currentNum > sorted[Math.floor(sorted.length / 2)];
  }
  const dates = allValues.map((v) => Date.parse(String(v))).filter((v) => Number.isFinite(v));
  const currentDate = Date.parse(String(value));
  if (dates.length > 0 && Number.isFinite(currentDate)) {
    const sorted = [...dates].sort((a, b) => a - b);
    return currentDate > sorted[Math.floor(sorted.length / 2)];
  }
  return false;
}

function runDiD(data: Record<string, string | number>[], treatmentCol: string, outcomeCol: string, timeCol: string) {
  const timeValues = data.map((r) => r[timeCol]);
  const rows = data.map((r) => ({
    treated: classifyTreatment(r[treatmentCol]),
    post: classifyPost(r[timeCol], timeValues),
    y: toNum(r[outcomeCol]),
  })).filter((r): r is { treated: boolean; post: boolean; y: number } => r.y !== null);

  const cellMean = (treated: boolean, post: boolean) => {
    const cell = rows.filter((r) => r.treated === treated && r.post === post);
    return cell.length ? cell.reduce((s, r) => s + r.y, 0) / cell.length : NaN;
  };
  const treatedPre = cellMean(true, false);
  const treatedPost = cellMean(true, true);
  const controlPre = cellMean(false, false);
  const controlPost = cellMean(false, true);
  if ([treatedPre, treatedPost, controlPre, controlPost].some((v) => Number.isNaN(v))) {
    throw new Error("DiD 需要处理组/对照组 × 干预前/后四个单元格都有数据");
  }
  const did = (treatedPost - treatedPre) - (controlPost - controlPre);
  return {
    method: "双重差分 (DiD)",
    did_effect: +did.toFixed(4),
    treated_pre: +treatedPre.toFixed(4),
    treated_post: +treatedPost.toFixed(4),
    control_pre: +controlPre.toFixed(4),
    control_post: +controlPost.toFixed(4),
    n: rows.length,
    interpretation: `DiD = (${treatedPost.toFixed(4)} - ${treatedPre.toFixed(4)}) - (${controlPost.toFixed(4)} - ${controlPre.toFixed(4)}) = ${did.toFixed(4)}。${did > 0 ? "干预相对提升了结果变量。" : did < 0 ? "干预相对降低了结果变量。" : "未观察到净干预效应。"}`,
  };
}

function runSyntheticControl(data: Record<string, string | number>[], treatmentCol: string, outcomeCol: string, timeCol: string) {
  const timeValues = data.map((r) => r[timeCol]);
  const rows = data.map((r) => ({
    treated: classifyTreatment(r[treatmentCol]),
    post: classifyPost(r[timeCol], timeValues),
    y: toNum(r[outcomeCol]),
  })).filter((r): r is { treated: boolean; post: boolean; y: number } => r.y !== null);
  const meanCell = (treated: boolean, post: boolean) => {
    const cell = rows.filter((r) => r.treated === treated && r.post === post);
    return cell.length ? cell.reduce((s, r) => s + r.y, 0) / cell.length : NaN;
  };
  const treatedPre = meanCell(true, false);
  const donorPre = meanCell(false, false);
  const treatedPost = meanCell(true, true);
  const donorPost = meanCell(false, true);
  if ([treatedPre, donorPre, treatedPost, donorPost].some((v) => Number.isNaN(v))) {
    throw new Error("合成控制需要处理单元与供体池在干预前后都有观测");
  }
  const preGap = treatedPre - donorPre;
  const syntheticPost = donorPost + preGap;
  const effect = treatedPost - syntheticPost;
  return {
    method: "合成控制法",
    post_effect: +effect.toFixed(4),
    treated_post: +treatedPost.toFixed(4),
    synthetic_post: +syntheticPost.toFixed(4),
    pre_period_gap: +preGap.toFixed(4),
    donor_pool_post_mean: +donorPost.toFixed(4),
    n: rows.length,
    interpretation: `以前期差距校准供体池后，合成对照后期基准为 ${syntheticPost.toFixed(4)}，处理单元后期均值为 ${treatedPost.toFixed(4)}，估计因果效应为 ${effect.toFixed(4)}。`,
  };
}

function simpleRegressionSSE(x: number[][], y: number[]) {
  const X = x.map((row) => [1, ...row]);
  const XtX = matMul(transpose(X), X);
  const beta = matVecMul(matInv(XtX.map((row, i) => row.map((v, j) => v + (i === j ? 1e-8 : 0)))), matVecMul(transpose(X), y));
  const yHat = X.map((row) => row.reduce((s, v, i) => s + v * beta[i], 0));
  return y.reduce((s, yi, i) => s + (yi - yHat[i]) ** 2, 0);
}

function runGranger(data: Record<string, string | number>[], causeCol: string, outcomeCol: string, timeCol: string) {
  const rows = data.map((r, i) => ({ t: timeCol ? r[timeCol] : i, x: toNum(r[causeCol]), y: toNum(r[outcomeCol]) }))
    .filter((r): r is { t: string | number; x: number; y: number } => r.x !== null && r.y !== null)
    .sort((a, b) => {
      const da = Date.parse(String(a.t)), db = Date.parse(String(b.t));
      if (Number.isFinite(da) && Number.isFinite(db)) return da - db;
      const na = toNum(a.t), nb = toNum(b.t);
      return (na ?? 0) - (nb ?? 0);
    });
  if (rows.length < 8) throw new Error("Granger 检验至少需要 8 个连续观测");
  const yTarget: number[] = [];
  const restrictedX: number[][] = [];
  const unrestrictedX: number[][] = [];
  for (let i = 1; i < rows.length; i++) {
    yTarget.push(rows[i].y);
    restrictedX.push([rows[i - 1].y]);
    unrestrictedX.push([rows[i - 1].y, rows[i - 1].x]);
  }
  const sseR = simpleRegressionSSE(restrictedX, yTarget);
  const sseU = simpleRegressionSSE(unrestrictedX, yTarget);
  const df1 = 1;
  const df2 = yTarget.length - 3;
  const F = ((sseR - sseU) / df1) / (sseU / df2);
  const p = 1 - fDistCDF(Math.max(0, F), df1, df2);
  return {
    method: "Granger 因果检验",
    F: +F.toFixed(4),
    df1,
    df2,
    p: +p.toFixed(6),
    restricted_sse: +sseR.toFixed(4),
    unrestricted_sse: +sseU.toFixed(4),
    n: rows.length,
    interpretation: p < 0.05 ? `${causeCol} 的滞后值显著提升了 ${outcomeCol} 的预测力，可认为存在 Granger 因果关系。` : `${causeCol} 的滞后值未显著提升 ${outcomeCol} 的预测力，未发现 Granger 因果关系。`,
  };
}

function transpose(m: number[][]): number[][] { return m[0].map((_, j) => m.map((r) => r[j])); }
function matMul(a: number[][], b: number[][]): number[][] {
  return a.map((row) => b[0].map((_, j) => row.reduce((s, _v, k) => s + row[k] * b[k][j], 0)));
}
function matVecMul(m: number[][], v: number[]): number[] { return m.map((row) => row.reduce((s, val, i) => s + val * v[i], 0)); }
function matInv(m: number[][]): number[][] {
  const n = m.length;
  const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(aug[r][i]) > Math.abs(aug[maxRow][i])) maxRow = r;
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
    const pivot = Math.abs(aug[i][i]) < 1e-10 ? 1e-10 : aug[i][i];
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const factor = aug[r][i];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[i][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

function fDistCDF(f: number, d1: number, d2: number): number {
  const x = (d1 * f) / (d1 * f + d2);
  return regIncBeta(x, d1 / 2, d2 / 2);
}

function regIncBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0; if (x >= 1) return 1;
  let sum = 0; const step = x / 300;
  for (let i = 0; i < 300; i++) {
    const t = (i + 0.5) * step;
    sum += t ** (a - 1) * (1 - t) ** (b - 1) * step;
  }
  return sum / (gammaFn(a) * gammaFn(b) / gammaFn(a + b));
}

function gammaFn(z: number): number {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
  z -= 1;
  const c = [0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  let x = c[0];
  for (let i = 1; i < c.length; i++) x += c[i] / (z + i);
  const t = z + 7.5;
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}

export default function CausalPage() {
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [method, setMethod] = useState("uplift");
  const [treatmentCol, setTreatmentCol] = useState("");
  const [outcomeCol, setOutcomeCol] = useState("");
  const [timeCol, setTimeCol] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    setResult(null);
    setAiResult("");
    const numCols = data.headers.filter((h) => data.rows.some((r) => typeof r[h] === "number"));
    if (numCols.length >= 2) { setTreatmentCol(numCols[0]); setOutcomeCol(numCols[1]); }
    setTimeCol(data.headers.find((h) => /time|date|period|week|month|日期|时间|期次|阶段/i.test(h)) ?? data.headers[2] ?? "");
  };

  const handleRun = async () => {
    if (!fileData) return;
    setLoading(true);
    setResult(null);
    setAiResult("");

    const currentMethod = METHODS.find((m) => m.id === method);

    if (method === "causal-ai") {
      if (!hasAnyKey()) { setLoading(false); return; }
      const sample = fileData.rows.slice(0, 30).map((r) => JSON.stringify(r)).join("\n");
      try {
        const res = await callLLM({
          messages: [
            { role: "system", content: customPrompt || "你是一个因果推断专家。分析数据中的因果关系，输出：1) 可能的因果路径 2) 混杂变量识别 3) 因果效应估计 4) 建议的因果分析方法。用中文输出。" },
            { role: "user", content: `列名: ${fileData.headers.join(", ")}\n数据样本:\n${sample}` },
          ],
          stream: true, onChunk: (t) => setAiResult((prev) => prev + t),
        });
        if (!aiResult) setAiResult(res);
        addRecord({ tool: "causal", type: "AI 因果分析", input: fileData.fileName, result: res || aiResult });
      } catch (e: unknown) { setAiResult(`错误: ${e instanceof Error ? e.message : "未知错误"}`); }
    } else {
      try {
        const featureCols = fileData.headers.filter((h) => h !== treatmentCol && h !== outcomeCol && h !== timeCol && fileData.rows.some((r) => typeof r[h] === "number"));
        const numericRows = fileData.rows.map((r) => {
          const row: Record<string, number> = {};
          for (const h of [treatmentCol, outcomeCol, ...featureCols]) {
            const v = r[h]; row[h] = typeof v === "number" ? v : Number(v) || 0;
          }
          return row;
        });
        const res =
          method === "uplift" ? runUplift(numericRows, treatmentCol, outcomeCol, featureCols) :
          method === "did" ? runDiD(fileData.rows, treatmentCol, outcomeCol, timeCol) :
          method === "scm" ? runSyntheticControl(fileData.rows, treatmentCol, outcomeCol, timeCol) :
          method === "granger" ? runGranger(fileData.rows, treatmentCol, outcomeCol, timeCol) :
          runUplift(numericRows, treatmentCol, outcomeCol, featureCols);
        setResult(res);
        addRecord({ tool: "causal", type: currentMethod?.label ?? method, input: `${treatmentCol} → ${outcomeCol}`, result: JSON.stringify(res) });
      } catch (e: unknown) {
        setAiResult(`错误: ${e instanceof Error ? e.message : "计算失败"}`);
      }
    }
    setLoading(false);
  };

  const selectedMethod = METHODS.find((m) => m.id === method);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-xl">🎯</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">因果推断工作台</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 CausalML · DoWhy · EconML · TFCausalImpact</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">上传数据 → 选择因果分析方法 → 估计处理效应 → 识别混杂变量</p>
        <ActiveProviderBadge className="mb-6" />

        <div className="flex flex-wrap gap-2 mb-6">
          {METHODS.map((m) => (
            <button key={m.id} onClick={() => { setMethod(m.id); setResult(null); setAiResult(""); }}
              className={cn("px-3 py-1.5 rounded-full text-xs border transition-colors",
                method === m.id ? "text-white" : "border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              )}
              style={method === m.id ? { background: m.color, borderColor: m.color } : undefined}>
              {m.label} {m.needsAI && <span className="ml-1 opacity-70">AI</span>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FileUpload onUpload={handleFileUpload} description="CSV，需包含处理变量（0/1）和结果变量" />

            {fileData && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{fileData.fileName}</span>
                  <Badge variant="outline" className="text-[10px]">{fileData.rowCount} 行</Badge>
                </div>

                {method !== "causal-ai" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">{method === "granger" ? "原因序列 X" : "处理/组别变量"}</label>
                      <select value={treatmentCol} onChange={(e) => setTreatmentCol(e.target.value)}
                        className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                        {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-muted)] mb-1 block">结果变量</label>
                      <select value={outcomeCol} onChange={(e) => setOutcomeCol(e.target.value)}
                        className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                        {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {["did", "scm", "granger"].includes(method) && (
                      <div className="col-span-2">
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">时间/期次列</label>
                        <select value={timeCol} onChange={(e) => setTimeCol(e.target.value)}
                          className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                          {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {method === "causal-ai" && (
                  <Textarea rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="自定义分析提示词（可选）..."
                    className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] resize-none" />
                )}

                <Button onClick={handleRun} disabled={loading || !fileData || (method !== "causal-ai" && (!treatmentCol || !outcomeCol))}
                  className="w-full h-10 bg-[var(--primary)] text-white hover:opacity-90">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 分析中...</> : <><Play className="w-4 h-4 mr-2" /> 运行分析</>}
                </Button>
              </div>
            )}
            <HistoryPanel tool="causal" />
          </div>

          <div className="space-y-4">
            <div className="glass-card p-6 min-h-[400px]">
              {result ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">{String(result.method ?? selectedMethod?.label ?? "因果分析")}结果</h3>
                  {Object.entries(result).filter(([k]) => k !== "feature_impacts" && k !== "interpretation").map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
                      <span className="text-xs text-[var(--text-tertiary)]">{k}</span>
                      <span className="text-xs font-mono text-[var(--text-primary)]">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                  {result.feature_impacts && (
                    <div className="mt-3">
                      <span className="text-xs text-[var(--text-muted)] mb-2 block">特征影响力</span>
                      {Object.entries(result.feature_impacts as Record<string, number>).map(([f, v]) => (
                        <div key={f} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-[var(--text-secondary)] w-20 truncate">{f}</span>
                          <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.abs(v as number) * 50)}%`, background: (v as number) > 0 ? "var(--success)" : "var(--error)" }} />
                          </div>
                          <span className="text-xs font-mono w-12 text-right">{(v as number).toFixed(3)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.interpretation && (
                    <div className="mt-3 p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10">
                      <span className="text-xs font-medium text-[var(--primary)] block mb-1">结论</span>
                      <p className="text-sm text-[var(--text-secondary)]">{result.interpretation as string}</p>
                    </div>
                  )}
                </div>
              ) : aiResult ? (
                <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{aiResult}</pre>
              ) : (
                <div className="text-[var(--text-muted)] text-sm text-center py-20">
                  <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>上传数据，选择方法，运行分析</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
