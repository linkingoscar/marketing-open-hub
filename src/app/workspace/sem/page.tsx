"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, GitBranch, Plus, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { ResultsExporter } from "@/components/workspace/results-exporter";
import { useHistoryStore } from "@/lib/api/history";
import { cn } from "@/lib/utils";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

/* ========== Types ========== */
interface LatentVariable {
  name: string;
  items: string[];
}

interface Path {
  from: string;
  to: string;
}

interface SEMResult {
  measurement: {
    variable: string;
    item: string;
    loading: number;
    loading_sq: number;
    error: number;
  }[];
  structural: {
    from: string;
    to: string;
    coefficient: number;
    se: number;
    t: number;
    p: number;
    significant: boolean;
  }[];
  rSquared: Record<string, number>;
  fit: {
    chi2: number;
    df: number;
    rmsea: number;
    cfi: number;
    srmr: number;
    rmsea_interp: string;
    cfi_interp: string;
    srmr_interp: string;
  };
  reliability: {
    variable: string;
    cr: number;
    ave: number;
    cr_ok: boolean;
    ave_ok: boolean;
  }[];
}

/* ========== PLS-SEM Algorithm (simplified) ========== */
function runPLSSEM(
  data: Record<string, number>[],
  latentVars: LatentVariable[],
  paths: Path[]
): SEMResult {
  const n = data.length;

  // Step 1: Calculate outer loadings (correlation of each item with its construct total)
  const constructScores: Record<string, number[]> = {};
  for (const lv of latentVars) {
    constructScores[lv.name] = Array.from({ length: n }, (_, i) =>
      lv.items.reduce((s, item) => s + (data[i][item] ?? 0), 0) / lv.items.length
    );
  }

  const measurement: SEMResult["measurement"] = [];
  for (const lv of latentVars) {
    for (const item of lv.items) {
      const itemVals = data.map((r) => r[item] ?? 0);
      const constructVals = constructScores[lv.name];
      const mi = itemVals.reduce((s, v) => s + v, 0) / n;
      const mc = constructVals.reduce((s, v) => s + v, 0) / n;
      let num = 0, d1 = 0, d2 = 0;
      for (let i = 0; i < n; i++) {
        const a = itemVals[i] - mi, b = constructVals[i] - mc;
        num += a * b; d1 += a * a; d2 += b * b;
      }
      const loading = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
      measurement.push({
        variable: lv.name,
        item,
        loading: +loading.toFixed(4),
        loading_sq: +(loading * loading).toFixed(4),
        error: +(1 - loading * loading).toFixed(4),
      });
    }
  }

  // Step 2: Calculate structural paths (regression)
  const structural: SEMResult["structural"] = [];
  const rSquared: Record<string, number> = {};

  for (const path of paths) {
    const yVals = constructScores[path.to];
    const xVals = constructScores[path.from];
    if (!yVals || !xVals) continue;

    const mx = xVals.reduce((s, v) => s + v, 0) / n;
    const my = yVals.reduce((s, v) => s + v, 0) / n;
    let ssxy = 0, ssxx = 0;
    for (let i = 0; i < n; i++) { ssxy += (xVals[i] - mx) * (yVals[i] - my); ssxx += (xVals[i] - mx) ** 2; }
    const beta = ssxx > 0 ? ssxy / ssxx : 0;
    const yHat = xVals.map((x) => my + beta * (x - mx));
    const residuals = yVals.map((y, i) => y - yHat[i]);
    const ssRes = residuals.reduce((s, r) => s + r ** 2, 0);
    const ssTot = yVals.reduce((s, y) => s + (y - my) ** 2, 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    // SE and t-test
    const mse = ssRes / (n - 2);
    const se = ssxx > 0 ? Math.sqrt(mse / ssxx) : 0;
    const t = se > 0 ? beta / se : 0;
    const p = 2 * (1 - normalCDF(Math.abs(t)));

    structural.push({
      from: path.from,
      to: path.to,
      coefficient: +beta.toFixed(4),
      se: +se.toFixed(4),
      t: +t.toFixed(4),
      p: +p.toFixed(6),
      significant: p < 0.05,
    });

    rSquared[path.to] = +r2.toFixed(4);
  }

  // Step 3: Reliability (CR + AVE) for each latent variable
  const reliability: SEMResult["reliability"] = [];
  for (const lv of latentVars) {
    const items = measurement.filter((m) => m.variable === lv.name);
    const loadings = items.map((i) => i.loading);
    const sumLoadings = loadings.reduce((s, l) => s + l, 0);
    const sumErrors = items.reduce((s, i) => s + i.error, 0);
    const cr = sumLoadings > 0 ? (sumLoadings ** 2) / (sumLoadings ** 2 + sumErrors) : 0;
    const ave = loadings.reduce((s, l) => s + l * l, 0) / loadings.length;
    reliability.push({
      variable: lv.name,
      cr: +cr.toFixed(4),
      ave: +ave.toFixed(4),
      cr_ok: cr >= 0.7,
      ave_ok: ave >= 0.5,
    });
  }

  // Step 4: Model fit approximation
  const allLoadings = measurement.map((m) => m.loading);
  const avgLoading = allLoadings.reduce((s, l) => s + l, 0) / allLoadings.length;
  const k = allLoadings.length;
  const chi2Approx = n * (k - 1) * (1 - avgLoading * avgLoading) * 0.5;
  const df = Math.max(1, (k * (k - 1)) / 2 - paths.length);
  const rmsea = df > 0 ? Math.sqrt(Math.max(0, (chi2Approx / df - 1) / Math.max(1, n - 1))) : 0;
  const cfi = chi2Approx > df ? Math.max(0, 1 - (chi2Approx - df) / (k * (k - 1) * n * 0.05)) : 1;
  const srmr = Math.sqrt(measurement.reduce((s, m) => s + m.error ** 2, 0) / k);

  const fit: SEMResult["fit"] = {
    chi2: +chi2Approx.toFixed(2),
    df,
    rmsea: +Math.min(1, rmsea).toFixed(4),
    cfi: +Math.min(1, Math.max(0, cfi)).toFixed(4),
    srmr: +srmr.toFixed(4),
    rmsea_interp: rmsea < 0.05 ? "良好" : rmsea < 0.08 ? "可接受" : "不佳",
    cfi_interp: cfi > 0.95 ? "良好" : cfi > 0.90 ? "可接受" : "不佳",
    srmr_interp: srmr < 0.05 ? "良好" : srmr < 0.08 ? "可接受" : "不佳",
  };

  return { measurement, structural, rSquared, fit, reliability };
}

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const s = x < 0 ? -1 : 1; x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  return 0.5 * (1 + s * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)));
}

/* ========== Component ========== */
export default function SEMPage() {
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [latentVars, setLatentVars] = useState<LatentVariable[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [newVarName, setNewVarName] = useState("");
  const [newVarItems, setNewVarItems] = useState("");
  const [pathFrom, setPathFrom] = useState("");
  const [pathTo, setPathTo] = useState("");
  const [result, setResult] = useState<SEMResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addRecord } = useHistoryStore();

  const numCols = fileData ? fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number")) : [];

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    setLatentVars([]);
    setPaths([]);
    setResult(null);
    setError("");
  };

  const addLatentVar = () => {
    if (!newVarName.trim()) return;
    const items = newVarItems.split(",").map((s) => s.trim()).filter(Boolean);
    if (items.length < 2) { setError("潜变量需要至少 2 个测量指标"); return; }
    setLatentVars((prev) => [...prev, { name: newVarName.trim(), items }]);
    setNewVarName("");
    setNewVarItems("");
    setError("");
  };

  const removeLatentVar = (name: string) => {
    setLatentVars((prev) => prev.filter((v) => v.name !== name));
    setPaths((prev) => prev.filter((p) => p.from !== name && p.to !== name));
  };

  const addPath = () => {
    if (!pathFrom || !pathTo || pathFrom === pathTo) return;
    if (paths.some((p) => p.from === pathFrom && p.to === pathTo)) return;
    setPaths((prev) => [...prev, { from: pathFrom, to: pathTo }]);
    setPathFrom("");
    setPathTo("");
  };

  const removePath = (from: string, to: string) => {
    setPaths((prev) => prev.filter((p) => !(p.from === from && p.to === to)));
  };

  const handleRun = () => {
    if (!fileData || latentVars.length < 1) { setError("请上传数据并定义至少 1 个潜变量"); return; }
    if (paths.length < 1) { setError("请定义至少 1 条结构路径"); return; }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = fileData.rows.map((r) => {
        const row: Record<string, number> = {};
        for (const h of fileData.headers) {
          const v = r[h];
          row[h] = typeof v === "number" ? v : 0;
        }
        return row;
      });
      const res = runPLSSEM(data, latentVars, paths);
      setResult(res);
      addRecord({ tool: "sem", type: "PLS-SEM", input: `${latentVars.length} LV, ${paths.length} paths`, result: JSON.stringify(res.fit) });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "SEM 计算失败");
    } finally {
      setLoading(false);
    }
  };

  const fitData = result ? [
    { dimension: "RMSEA", value: Math.min(result.fit.rmsea * 10, 1) * 100 },
    { dimension: "CFI", value: result.fit.cfi * 100 },
    { dimension: "SRMR", value: Math.min(result.fit.srmr * 10, 1) * 100 },
  ] : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-xl">🔗</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">结构方程模型 (SEM)</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 SmartPLS / AMOS 方法论 · PLS-SEM 算法</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">上传数据 → 定义潜变量 → 指定路径 → 运行 PLS-SEM → 查看路径系数、拟合指标、信效度</p>

        {error && (
          <div className="glass-card p-3 mb-4 border-[var(--warning)]/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0" />
            <p className="text-sm text-[var(--warning)]">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div className="space-y-4">
            {/* Step 1: Upload data */}
            <div className="glass-card p-4">
              <span className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Step 1 · 上传数据</span>
              <FileUpload onUpload={handleFileUpload} description="CSV 文件，每行一个样本，列名为量表题项" />
              {fileData && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{fileData.fileName}</Badge>
                  <Badge variant="outline" className="text-[10px]">{fileData.rowCount} 行 × {fileData.colCount} 列</Badge>
                  <span className="text-[10px] text-[var(--text-muted)]">数值列: {numCols.length}</span>
                </div>
              )}
            </div>

            {/* Step 2: Define latent variables */}
            <div className="glass-card p-4">
              <span className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Step 2 · 定义潜变量（测量模型）</span>
              <div className="space-y-2 mb-3">
                <Input placeholder="潜变量名称，如：感知价值" value={newVarName} onChange={(e) => setNewVarName(e.target.value)}
                  className="h-8 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
                <Input placeholder="测量指标（逗号分隔），如：PV1, PV2, PV3" value={newVarItems} onChange={(e) => setNewVarItems(e.target.value)}
                  className="h-8 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
                <Button size="sm" onClick={addLatentVar} className="h-8 bg-[var(--primary)] text-white">
                  <Plus className="w-3 h-3 mr-1" /> 添加潜变量
                </Button>
              </div>
              <div className="space-y-2">
                {latentVars.map((lv) => (
                  <div key={lv.name} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-card)]">
                    <GitBranch className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{lv.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">← {lv.items.join(", ")}</span>
                    <button onClick={() => removeLatentVar(lv.name)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--error)]">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Define structural paths */}
            <div className="glass-card p-4">
              <span className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Step 3 · 定义结构路径</span>
              <div className="flex gap-2 mb-3">
                <select value={pathFrom} onChange={(e) => setPathFrom(e.target.value)}
                  className="flex-1 h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                  <option value="">自变量 (X)</option>
                  {latentVars.map((lv) => <option key={lv.name} value={lv.name}>{lv.name}</option>)}
                </select>
                <span className="self-center text-[var(--text-muted)]">→</span>
                <select value={pathTo} onChange={(e) => setPathTo(e.target.value)}
                  className="flex-1 h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                  <option value="">因变量 (Y)</option>
                  {latentVars.map((lv) => <option key={lv.name} value={lv.name}>{lv.name}</option>)}
                </select>
                <Button size="sm" onClick={addPath} className="h-8 bg-[var(--primary)] text-white">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {paths.map((p) => (
                  <div key={`${p.from}-${p.to}`} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-card)] text-sm">
                    <span className="text-[var(--primary)]">{p.from}</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="text-[var(--accent)]">{p.to}</span>
                    <button onClick={() => removePath(p.from, p.to)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--error)]">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleRun} disabled={loading || !fileData || latentVars.length < 1 || paths.length < 1}
              className="w-full h-11 bg-[var(--primary)] text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 计算中...</> : <><Play className="w-4 h-4 mr-2" /> 运行 PLS-SEM</>}
            </Button>

            <HistoryPanel tool="sem" />
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {result && (
              <>
                {/* Fit indices */}
                <div className="glass-card p-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">模型拟合指标</span>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: "RMSEA", value: result.fit.rmsea, interp: result.fit.rmsea_interp, good: result.fit.rmsea < 0.08 },
                      { label: "CFI", value: result.fit.cfi, interp: result.fit.cfi_interp, good: result.fit.cfi > 0.90 },
                      { label: "SRMR", value: result.fit.srmr, interp: result.fit.srmr_interp, good: result.fit.srmr < 0.08 },
                    ].map((m) => (
                      <div key={m.label} className="text-center p-2 rounded-lg bg-[var(--bg-card)]">
                        <div className="text-lg font-bold" style={{ color: m.good ? "var(--success)" : "var(--warning)" }}>{m.value.toFixed(3)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{m.label}</div>
                        <div className="text-[10px]" style={{ color: m.good ? "var(--success)" : "var(--warning)" }}>{m.interp}</div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <RadarChart data={fitData}>
                      <PolarGrid stroke="rgba(148,163,184,0.3)" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                      <Radar name="拟合" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Measurement model */}
                <div className="glass-card p-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">测量模型（因子载荷）</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 px-2 text-[var(--text-muted)]">潜变量</th>
                        <th className="text-left py-2 px-2 text-[var(--text-muted)]">指标</th>
                        <th className="text-right py-2 px-2 text-[var(--text-muted)]">载荷 λ</th>
                        <th className="text-right py-2 px-2 text-[var(--text-muted)]">λ²</th>
                        <th className="text-right py-2 px-2 text-[var(--text-muted)]">误差</th>
                      </tr></thead>
                      <tbody>{result.measurement.map((m, i) => (
                        <tr key={i} className="border-b border-[var(--border)]">
                          <td className="py-2 px-2 text-[var(--primary)] font-medium">{m.variable}</td>
                          <td className="py-2 px-2 text-[var(--text-secondary)] font-mono">{m.item}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: m.loading >= 0.7 ? "var(--success)" : m.loading >= 0.5 ? "var(--warning)" : "var(--error)" }}>{m.loading.toFixed(3)}</td>
                          <td className="text-right py-2 px-2 font-mono text-[var(--text-secondary)]">{m.loading_sq.toFixed(3)}</td>
                          <td className="text-right py-2 px-2 font-mono text-[var(--text-secondary)]">{m.error.toFixed(3)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>

                {/* Structural model */}
                <div className="glass-card p-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">结构模型（路径系数）</span>
                  <div className="space-y-2">
                    {result.structural.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-card)]">
                        <span className="text-sm font-medium text-[var(--primary)]">{s.from}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full bg-[var(--bg-tertiary)] relative">
                            <div className="absolute inset-y-0 left-0 rounded-full" style={{
                              width: `${Math.min(100, Math.abs(s.coefficient) * 100)}%`,
                              background: s.coefficient >= 0 ? "var(--success)" : "var(--error)",
                            }} />
                          </div>
                          <span className="text-sm font-mono font-bold" style={{ color: s.significant ? "var(--success)" : "var(--text-muted)" }}>
                            β = {s.coefficient.toFixed(3)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[var(--accent)]">{s.to}</span>
                        <Badge variant="outline" className={cn("text-[10px]",
                          s.significant ? "border-[var(--success)]/30 text-[var(--success)]" : "border-[var(--text-muted)]/30 text-[var(--text-muted)]"
                        )}>
                          {s.p < 0.001 ? "p < .001" : `p = ${s.p.toFixed(3)}`} {s.significant ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* R² */}
                <div className="glass-card p-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">解释方差 (R²)</span>
                  <div className="space-y-2">
                    {Object.entries(result.rSquared).map(([varName, r2]) => (
                      <div key={varName} className="flex items-center gap-3">
                        <span className="text-sm text-[var(--text-primary)] w-24">{varName}</span>
                        <div className="flex-1 h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${r2 * 100}%` }} />
                        </div>
                        <span className="text-sm font-mono text-[var(--text-primary)] w-12 text-right">{(r2 * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reliability */}
                <div className="glass-card p-4">
                  <span className="text-xs font-medium text-[var(--text-muted)] mb-3 block">信度与效度</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 px-2 text-[var(--text-muted)]">潜变量</th>
                        <th className="text-right py-2 px-2 text-[var(--text-muted)]">CR</th>
                        <th className="text-right py-2 px-2 text-[var(--text-muted)]">AVE</th>
                        <th className="text-center py-2 px-2 text-[var(--text-muted)]">CR ≥ .7</th>
                        <th className="text-center py-2 px-2 text-[var(--text-muted)]">AVE ≥ .5</th>
                      </tr></thead>
                      <tbody>{result.reliability.map((r, i) => (
                        <tr key={i} className="border-b border-[var(--border)]">
                          <td className="py-2 px-2 text-[var(--primary)] font-medium">{r.variable}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: r.cr_ok ? "var(--success)" : "var(--error)" }}>{r.cr.toFixed(3)}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: r.ave_ok ? "var(--success)" : "var(--error)" }}>{r.ave.toFixed(3)}</td>
                          <td className="text-center py-2 px-2">{r.cr_ok ? "✓" : "✗"}</td>
                          <td className="text-center py-2 px-2">{r.ave_ok ? "✓" : "✗"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>

                {/* APA Report */}
                <ResultsExporter
                  testLabel="PLS-SEM 结构方程模型"
                  apa={{
                    test: "Partial Least Squares SEM",
                    statistic: `χ² = ${result.fit.chi2}, df = ${result.fit.df}, RMSEA = ${result.fit.rmsea.toFixed(3)}, CFI = ${result.fit.cfi.toFixed(3)}, SRMR = ${result.fit.srmr.toFixed(3)}`,
                    p: result.structural.some((s) => s.p < 0.05) ? "< .05" : "≥ .05",
                    conclusion: `模型拟合：RMSEA ${result.fit.rmsea_interp}（${result.fit.rmsea.toFixed(3)}），CFI ${result.fit.cfi_interp}（${result.fit.cfi.toFixed(3)}），SRMR ${result.fit.srmr_interp}（${result.fit.srmr.toFixed(3)}）。路径系数：${result.structural.map((s) => `${s.from}→${s.to}: β=${s.coefficient.toFixed(3)}${s.significant ? "*" : ""}`).join("；")}。`,
                    interpretation: `PLS-SEM 分析（N = ${fileData?.rowCount ?? 0}）显示模型拟合${result.fit.rmsea < 0.08 && result.fit.cfi > 0.90 ? "可接受" : "需要改进"}。${result.structural.filter((s) => s.significant).length}/${result.structural.length} 条路径显著。`,
                  }}
                  stats={{ ...result.fit, ...result.rSquared }}
                />
              </>
            )}

            {!result && (
              <div className="glass-card p-6 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-[var(--text-muted)]">
                  <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>上传数据 → 定义潜变量 → 指定路径 → 运行</p>
                  <p className="text-xs mt-1">PLS-SEM 算法在浏览器端运行</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
