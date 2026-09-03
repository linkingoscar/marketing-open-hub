"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { VariableBubbles } from "@/components/empirical/variable-bubbles";
import { FrameworkCanvas } from "@/components/empirical/framework-canvas";
import { autoDetectConstructs, type Construct, type VariableItem } from "@/lib/empirical/construct-detector";
import { PROCESS_TEMPLATES, type ProcessTemplate } from "@/lib/empirical/process-templates";
import { useHistoryStore } from "@/lib/api/history";
import { ResultsExporter } from "@/components/workspace/results-exporter";
import { DocxExport, type DocxSection } from "@/components/workspace/docx-export";
import { runBootstrapMediation, type MediationResult } from "@/lib/empirical/bootstrap-mediation";
import { cn } from "@/lib/utils";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

interface PathResult {
  from: string;
  to: string;
  coefficient: number;
  se: number;
  t: number;
  p: number;
  significant: boolean;
  label: string;
}

interface AnalysisResult {
  paths: PathResult[];
  rSquared: Record<string, number>;
  diagnostics: {
    avgR2: number;
    adjR2: number;
    f2: number;
    fStat: number;
    fProb: number;
  };
  reliability: { construct: string; cr: number; ave: number }[];
  interpretation: string;
  mediationResult?: MediationResult | null;
}

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const s = x < 0 ? -1 : 1; x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  return 0.5 * (1 + s * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)));
}

function runAnalysis(
  data: Record<string, number>[],
  constructs: Construct[],
  template: ProcessTemplate,
  assignments: Record<string, string>
): AnalysisResult {
  const n = data.length;
  const constructScores: Record<string, number[]> = {};
  for (const c of constructs) {
    constructScores[c.id] = c.meanScore;
  }

  const paths: PathResult[] = [];
  const rSquared: Record<string, number> = {};

  for (const pathDef of template.paths) {
    const fromId = assignments[pathDef.from];
    const toId = assignments[pathDef.to];
    if (!fromId || !toId || fromId === toId) continue;

    const xVals = constructScores[fromId];
    const yVals = constructScores[toId];
    if (!xVals || !yVals) continue;

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
    const mse = ssRes / (n - 2);
    const se = ssxx > 0 ? Math.sqrt(mse / ssxx) : 0;
    const t = se > 0 ? beta / se : 0;
    const p = 2 * (1 - normalCDF(Math.abs(t)));

    const fromConstruct = constructs.find((c) => c.id === fromId);
    const toConstruct = constructs.find((c) => c.id === toId);

    paths.push({
      from: fromId, to: toId,
      coefficient: +beta.toFixed(4), se: +se.toFixed(4),
      t: +t.toFixed(4), p: +p.toFixed(6),
      significant: p < 0.05,
      label: pathDef.label ?? `${fromConstruct?.displayName} → ${toConstruct?.displayName}`,
    });

    if (!rSquared[toId] || r2 > rSquared[toId]) rSquared[toId] = +r2.toFixed(4);
  }

  // Reliability per construct
  const reliability = constructs.filter((c) => assignments && Object.values(assignments).includes(c.id)).map((c) => {
    const items = c.items;
    const k = items.length;
    const itemVars = items.map((i) => {
      const m = i.mean;
      return i.values.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, i.values.length - 1);
    });
    const totalVar = c.meanScore.reduce((s, v) => s + (v - c.meanScore.reduce((a, b) => a + b, 0) / n) ** 2, 0) / Math.max(1, n - 1);
    const cr = totalVar > 0 ? (k / (k - 1)) * (1 - itemVars.reduce((s, v) => s + v, 0) / totalVar) : 0;
    const loadings = items.map((i) => {
      const m = i.mean, mc = c.meanScore.reduce((a, b) => a + b, 0) / n;
      let num = 0, d1 = 0, d2 = 0;
      for (let j = 0; j < Math.min(i.values.length, c.meanScore.length); j++) {
        const a = i.values[j] - m, b = c.meanScore[j] - mc;
        num += a * b; d1 += a * a; d2 += b * b;
      }
      return d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;
    });
    const ave = loadings.reduce((s, l) => s + l * l, 0) / k;
    return { construct: c.displayName, cr: +cr.toFixed(4), ave: +ave.toFixed(4) };
  });

  const avgR2 = Object.values(rSquared).length > 0 ? Object.values(rSquared).reduce((s, v) => s + v, 0) / Object.values(rSquared).length : 0;
  const numPreds = Math.max(1, paths.length);
  const df1 = numPreds;
  const df2 = Math.max(1, n - df1 - 1);
  const adjR2 = Math.max(0, 1 - ((1 - avgR2) * (n - 1)) / df2);
  const fStat = avgR2 < 1 ? (avgR2 / df1) / ((1 - avgR2) / df2) : 999;
  const f2 = avgR2 < 1 ? avgR2 / Math.max(0.001, 1 - avgR2) : 0;
  const fProb = Math.max(0.0001, 1 - (fStat > 0 ? normalCDF(Math.sqrt(Math.max(0, 2 * fStat))) : 0));
  const diagnostics = {
    avgR2: +avgR2.toFixed(4),
    adjR2: +adjR2.toFixed(4),
    f2: +f2.toFixed(4),
    fStat: +fStat.toFixed(2),
    fProb: +fProb.toFixed(4),
  };

  // 运行 Hayes Model 4 Bootstrap 中介效应检验（当分配了 X, M, Y 构念角色时）
  let mediationResult: MediationResult | null = null;
  const xId = assignments["X"];
  const mId = assignments["M"] || assignments["M1"];
  const yId = assignments["Y"];

  if (xId && mId && yId && constructScores[xId] && constructScores[mId] && constructScores[yId]) {
    try {
      mediationResult = runBootstrapMediation({
        x: constructScores[xId],
        m: constructScores[mId],
        y: constructScores[yId],
        bootstraps: 1000,
      });
    } catch (e) {
      console.warn("Bootstrap mediation calculation skipped:", e);
    }
  }

  const significantPaths = paths.filter((p) => p.significant).length;
  let interpretation = `共 ${paths.length} 条路径，${significantPaths} 条显著（${((significantPaths / Math.max(1, paths.length)) * 100).toFixed(0)}%）。` +
    paths.map((p) => `${p.label}: β=${p.coefficient.toFixed(3)}, p=${p.p < 0.001 ? "<.001" : p.p.toFixed(3)} ${p.significant ? "✓" : "✗"}`).join("；");

  if (mediationResult) {
    interpretation += `\n${mediationResult.apaSummary}`;
  }

  return { paths, rSquared, diagnostics, reliability, interpretation, mediationResult };
}

export default function EmpiricalPage() {
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [constructs, setConstructs] = useState<Construct[]>([]);
  const [ungrouped, setUngrouped] = useState<VariableItem[]>([]);
  const [demographics, setDemographics] = useState<VariableItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate>(PROCESS_TEMPLATES[1]); // Model 4 default
  const [selectedConstructs, setSelectedConstructs] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "explore" | "analyze">("upload");
  const { addRecord } = useHistoryStore();

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    const detected = autoDetectConstructs(data.headers, data.rows);
    setConstructs(detected.constructs);
    setUngrouped(detected.ungrouped);
    setDemographics(detected.demographics);
    setStep("explore");
    setResult(null);
  };

  const handleRemoveItem = (constructId: string, itemName: string) => {
    setConstructs((prev) => prev.map((c) => {
      if (c.id !== constructId) return c;
      const newItems = c.items.filter((i) => i.name !== itemName);
      if (newItems.length < 2) {
        setUngrouped((u) => [...u, ...c.items]);
        return null as unknown as Construct;
      }
      return { ...c, items: newItems };
    }).filter(Boolean) as Construct[]);
  };

  const handleRemoveConstruct = (constructId: string) => {
    const construct = constructs.find((c) => c.id === constructId);
    if (construct) setUngrouped((u) => [...u, ...construct.items]);
    setConstructs((prev) => prev.filter((c) => c.id !== constructId));
  };

  const handleMergeItems = (itemNames: string[], newName: string) => {
    const allItems = [...constructs.flatMap((c) => c.items), ...ungrouped];
    const mergedItems = allItems.filter((i) => itemNames.includes(i.name));
    if (mergedItems.length < 2) return;

    const n = mergedItems[0].values.length;
    const meanScore = Array.from({ length: n }, (_, i) =>
      mergedItems.reduce((s, item) => s + (item.values[i] ?? 0), 0) / mergedItems.length
    );

    const colors = ["#6366F1", "#06B6D4", "#F59E0B", "#EC4899", "#10B981", "#EF4444", "#8B5CF6", "#14B8A6"];
    const newConstruct: Construct = {
      id: newName.toLowerCase().replace(/\s+/g, "_"),
      name: newName.toLowerCase().replace(/\s+/g, "_"),
      displayName: newName,
      items: mergedItems,
      color: colors[constructs.length % colors.length],
      meanScore,
    };

    setConstructs((prev) => [...prev.filter((c) => !c.items.some((i) => itemNames.includes(i.name))), newConstruct]);
    setUngrouped((prev) => prev.filter((i) => !itemNames.includes(i.name)));
  };

  const handleRunAnalysis = useCallback((assignments: Record<string, string>) => {
    if (!fileData) return;
    setLoading(true);
    setResult(null);

    setTimeout(() => {
      try {
        const data = fileData.rows.map((r) => {
          const row: Record<string, number> = {};
          for (const h of fileData.headers) { const v = r[h]; row[h] = typeof v === "number" ? v : 0; }
          return row;
        });
        const res = runAnalysis(data, constructs, selectedTemplate, assignments);
        setResult(res);
        addRecord({ tool: "empirical", type: selectedTemplate.name, input: `${constructs.length} constructs`, result: res.interpretation });
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [fileData, constructs, selectedTemplate, addRecord]);

  const fitData = result ? [
    { dimension: "R²解释率", value: Math.min(100, Math.round(result.diagnostics.avgR2 * 100)) },
    { dimension: "调整后R²", value: Math.min(100, Math.round(result.diagnostics.adjR2 * 100)) },
    { dimension: "效应量f²", value: Math.min(100, Math.round(result.diagnostics.f2 * 100)) },
  ] : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-xl">🔬</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">实证分析工作台</h1>
            <p className="text-sm text-[var(--text-muted)]">构念自动识别 · PROCESS 框架 · 可视化路径分析</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-8">上传数据 → 自动识别构念 → 选择分析框架 → 拖拽变量 → 运行 → 查看路径动画反馈</p>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { id: "upload", label: "上传数据", icon: Upload },
            { id: "explore", label: "构念识别", icon: Layers },
            { id: "analyze", label: "框架分析", icon: Zap },
          ].map((s, i) => (
            <button key={s.id} onClick={() => {
              if (s.id === "upload") setStep("upload");
              else if (s.id === "explore" && fileData) setStep("explore");
              else if (s.id === "analyze" && constructs.length > 0) setStep("analyze");
            }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
              step === s.id ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}>
              <s.icon className="w-4 h-4" />
              <span>{s.label}</span>
              {i < 2 && <span className="text-[var(--text-muted)]">→</span>}
            </button>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            <FileUpload onUpload={handleFileUpload} description="CSV 文件，列名按 purchase_1, brand_trust_2 格式自动识别构念" />
          </div>
        )}

        {/* Step 2: Explore constructs */}
        {step === "explore" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[var(--text-secondary)]">
                  识别到 <strong className="text-[var(--primary)]">{constructs.length}</strong> 个构念，
                  <strong className="text-[var(--accent)]">{ungrouped.length}</strong> 个未分组变量
                </span>
              </div>
              <Button onClick={() => setStep("analyze")} disabled={constructs.length < 2}
                className="bg-[var(--primary)] text-white">
                下一步：选择框架 <Zap className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <VariableBubbles
              constructs={constructs}
              ungrouped={ungrouped}
              demographics={demographics}
              onRemoveItem={handleRemoveItem}
              onMergeItems={handleMergeItems}
              onRemoveConstruct={handleRemoveConstruct}
              selectedConstructs={selectedConstructs}
              onSelectConstruct={(id) => setSelectedConstructs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
            />
          </div>
        )}

        {/* Step 3: Analyze with framework */}
        {step === "analyze" && (
          <div className="space-y-6">
            {/* Template selector — grouped by category */}
            <div className="glass-card p-5">
              <span className="text-xs font-medium text-[var(--text-muted)] mb-4 block">选择分析框架（Hayes PROCESS）</span>
              <div className="space-y-4">
                {[
                  { key: "moderation", label: "调节效应", color: "#EC4899" },
                  { key: "mediation", label: "中介效应", color: "#F59E0B" },
                  { key: "serial", label: "序列中介", color: "#06B6D4" },
                  { key: "parallel", label: "并行中介", color: "#10B981" },
                  { key: "moderated-mediation", label: "调节中介", color: "#8B5CF6" },
                  { key: "mediated-moderation", label: "中介调节", color: "#EF4444" },
                  { key: "custom", label: "自定义", color: "#64748B" },
                ].map((group) => {
                  const templates = PROCESS_TEMPLATES.filter((t) => t.category === group.key);
                  if (templates.length === 0) return null;
                  return (
                    <div key={group.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                        <span className="text-xs font-medium" style={{ color: group.color }}>{group.label}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {templates.map((t) => (
                          <button key={t.id} onClick={() => { setSelectedTemplate(t); setResult(null); }}
                            className={cn("p-3 rounded-xl text-left border transition-all group/tpl",
                              selectedTemplate.id === t.id
                                ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_12px_var(--glow-primary)]"
                                : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card)]"
                            )}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${group.color}20`, color: group.color }}>
                                M{t.modelNumber}
                              </span>
                              <span className="text-xs font-medium text-[var(--text-primary)] group-hover/tpl:text-[var(--primary-light)] transition-colors">
                                {t.nameCN}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{t.description}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 italic line-clamp-1">{t.useCase}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected template detail */}
              <div className="mt-4 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{selectedTemplate.nameCN}</span>
                  <Badge variant="outline" className="text-[10px]">PROCESS Model {selectedTemplate.modelNumber}</Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">{selectedTemplate.interpretation}</p>
                <p className="text-[10px] text-[var(--text-muted)]">💡 {selectedTemplate.useCase}</p>
              </div>
            </div>

            {/* Framework canvas */}
            <FrameworkCanvas
              template={selectedTemplate}
              constructs={constructs}
              onRunAnalysis={handleRunAnalysis}
              results={result?.paths ?? null}
              loading={loading}
            />

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {/* Path results with animation */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">路径分析结果</h3>
                  <div className="space-y-3">
                    {result.paths.map((path, i) => {
                      const fromC = constructs.find((c) => c.id === path.from);
                      const toC = constructs.find((c) => c.id === path.to);
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-card)]"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-3 h-3 rounded-full" style={{ background: fromC?.color ?? "#6366F1" }} />
                            <span className="text-sm text-[var(--text-primary)]">{fromC?.displayName ?? path.from}</span>
                            {/* Animated beam */}
                            <div className="flex-1 h-0.5 relative mx-2">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.8, delay: i * 0.15 }}
                                className="h-full origin-left rounded-full"
                                style={{ background: path.significant ? "var(--success)" : "var(--error)" }}
                              />
                              {/* Traveling particle */}
                              <motion.div
                                initial={{ left: "0%" }}
                                animate={{ left: "100%" }}
                                transition={{ duration: 1.2, delay: i * 0.15 + 0.3, ease: "easeInOut" }}
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                style={{ background: path.significant ? "var(--success)" : "var(--error)", boxShadow: `0 0 8px ${path.significant ? "var(--success)" : "var(--error)"}` }}
                              />
                            </div>
                            <div className="w-3 h-3 rounded-full" style={{ background: toC?.color ?? "#06B6D4" }} />
                            <span className="text-sm text-[var(--text-primary)]">{toC?.displayName ?? path.to}</span>
                          </div>
                          <span className="font-mono text-sm font-bold" style={{ color: path.significant ? "var(--success)" : "var(--error)" }}>
                            β={path.coefficient.toFixed(3)}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px]",
                            path.significant ? "border-[var(--success)]/30 text-[var(--success)]" : "border-[var(--error)]/30 text-[var(--error)]"
                          )}>
                            {path.p < 0.001 ? "p<.001" : `p=${path.p.toFixed(3)}`} {path.significant ? "✓" : "✗"}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* R² */}
                <div className="glass-card p-4">
                  <span className="text-xs text-[var(--text-muted)] mb-3 block">解释方差 (R²)</span>
                  <div className="space-y-2">
                    {Object.entries(result.rSquared).map(([id, r2]) => {
                      const c = constructs.find((c) => c.id === id);
                      return (
                        <div key={id} className="flex items-center gap-3">
                          <span className="text-sm text-[var(--text-primary)] w-24">{c?.displayName ?? id}</span>
                          <div className="flex-1 h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${r2 * 100}%` }} transition={{ duration: 0.8 }}
                              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
                          </div>
                          <span className="text-sm font-mono text-[var(--text-primary)] w-12 text-right">{(r2 * 100).toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mediation decomposition if available */}
                {result.mediationResult && (
                  <div className="glass-card p-6 border-[var(--primary)]/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                          Hayes PROCESS 中介效应检验（Bootstrap 1000 次重抽样）
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-2.5 py-0.5",
                          result.mediationResult.indirectEffect.significant
                            ? "border-[var(--success)]/40 text-[var(--success)] bg-[var(--success)]/10"
                            : "border-[var(--error)]/40 text-[var(--error)] bg-[var(--error)]/10"
                        )}
                      >
                        {result.mediationResult.indirectEffect.significant
                          ? `${result.mediationResult.mediationType === "full" ? "完全中介成立" : "部分中介成立"}`
                          : "中介效应未达显著"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-[var(--bg-card)]">
                        <span className="text-[11px] text-[var(--text-muted)] block mb-1">间接效应 (a × b)</span>
                        <span className="font-mono text-base font-bold text-[var(--primary)]">
                          {result.mediationResult.indirectEffect.effect.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">
                          Boot SE={result.mediationResult.indirectEffect.bootSE.toFixed(3)}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-card)]">
                        <span className="text-[11px] text-[var(--text-muted)] block mb-1">Bootstrap 95% CI</span>
                        <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                          [{result.mediationResult.indirectEffect.bootLLCI}, {result.mediationResult.indirectEffect.bootULCI}]
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">区间不跨 0 即显著</span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-card)]">
                        <span className="text-[11px] text-[var(--text-muted)] block mb-1">直接效应 (c&apos;)</span>
                        <span className="font-mono text-base font-bold text-[var(--text-primary)]">
                          {result.mediationResult.directEffect.effect.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">
                          p={result.mediationResult.directEffect.p < 0.001 ? "<.001" : result.mediationResult.directEffect.p.toFixed(3)}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-card)]">
                        <span className="text-[11px] text-[var(--text-muted)] block mb-1">总效应 (c)</span>
                        <span className="font-mono text-base font-bold text-[var(--text-primary)]">
                          {result.mediationResult.totalEffect.effect.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">
                          占比 {(result.mediationResult.indirectEffect.ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-3 rounded-lg border border-[var(--border)]">
                      {result.mediationResult.apaSummary}
                    </p>
                  </div>
                )}

                {/* Fit + Reliability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-4">
                    <span className="text-xs text-[var(--text-muted)] mb-3 block">模型诊断 (Model Diagnostics)</span>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={fitData}>
                        <PolarGrid stroke="rgba(148,163,184,0.3)" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                        <Radar name="拟合" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-4 gap-2 text-center mt-2">
                      <div>
                        <div className="text-base font-bold text-[var(--primary)]">{result.diagnostics.avgR2.toFixed(3)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">平均 R²</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-[var(--text-primary)]">{result.diagnostics.adjR2.toFixed(3)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">调整后 R²</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-[var(--accent)]">{result.diagnostics.f2.toFixed(3)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Cohen&apos;s f²</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-[var(--success)]">{result.diagnostics.fStat.toFixed(2)}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">F 统计量</div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-4">
                    <span className="text-xs text-[var(--text-muted)] mb-3 block">信度与收敛效度 (CR + AVE)</span>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 px-2 text-[var(--text-muted)]">构念</th>
                        <th className="text-right py-2 px-2 text-[var(--text-muted)]">CR</th>
                        <th className="text-right py-2 px-2 text-[var(--text-muted)]">AVE</th>
                        <th className="text-center py-2 px-2 text-[var(--text-muted)]">判定</th>
                      </tr></thead>
                      <tbody>{result.reliability.map((r, i) => (
                        <tr key={i} className="border-b border-[var(--border)]">
                          <td className="py-2 px-2 text-[var(--text-primary)]">{r.construct}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: r.cr >= 0.7 ? "var(--success)" : "var(--error)" }}>{r.cr.toFixed(3)}</td>
                          <td className="text-right py-2 px-2 font-mono" style={{ color: r.ave >= 0.5 ? "var(--success)" : "var(--error)" }}>{r.ave.toFixed(3)}</td>
                          <td className="text-center py-2 px-2">{r.cr >= 0.7 && r.ave >= 0.5 ? "✓" : "✗"}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>

                {/* Export Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 glass-card">
                  <div className="text-xs text-[var(--text-muted)]">
                    已生成符合 APA 第 7 版学术规范的实证分析统计表格与解读文本
                  </div>
                  <div className="flex items-center gap-2">
                    <DocxExport
                      title={`${selectedTemplate.nameCN} 实证研究分析报告`}
                      sections={[
                        {
                          heading: "一、研究模型与结构路径检验",
                          content: result.interpretation,
                          table: {
                            caption: "表 1. 结构模型路径回归系数与显著性检验结果 (APA 7th)",
                            columns: [
                              { header: "假设路径", key: "label" },
                              { header: "路径系数 β", key: "coeff" },
                              { header: "标准误 SE", key: "se" },
                              { header: "t 统计量", key: "t" },
                              { header: "p 值", key: "p" },
                              { header: "假设判定", key: "conclusion" },
                            ],
                            rows: result.paths.map((p) => ({
                              label: p.label,
                              coeff: p.coefficient.toFixed(3),
                              se: p.se.toFixed(3),
                              t: p.t.toFixed(2),
                              p: p.p < 0.001 ? "< .001" : p.p.toFixed(3),
                              conclusion: p.significant ? "假设支持" : "未达显著",
                            })),
                            note: "* p < .05, ** p < .01, *** p < .001",
                          },
                        },
                        ...(result.mediationResult
                          ? [
                              {
                                heading: "二、Hayes PROCESS 中介效应检验（Bootstrap 1000 次重抽样）",
                                content: result.mediationResult.apaSummary,
                                table: {
                                  caption: "表 2. 中介效应分解与 Bootstrap 95% 置信区间 (Model 4)",
                                  columns: [
                                    { header: "效应路径", key: "path" },
                                    { header: "效应值 Effect", key: "coeff" },
                                    { header: "SE / Boot SE", key: "se" },
                                    { header: "t 统计量", key: "t" },
                                    { header: "p 值", key: "p" },
                                    { header: "95% 置信区间", key: "ci" },
                                  ],
                                  rows: [
                                    ...result.mediationResult.tableData.map((d) => ({
                                      path: d.path,
                                      coeff: d.coeff.toFixed(3),
                                      se: d.se.toFixed(3),
                                      t: d.t.toFixed(2),
                                      p: d.p,
                                      ci: d.ci,
                                    })),
                                    {
                                      path: "间接效应 (Indirect Effect: a × b)",
                                      coeff: result.mediationResult.indirectEffect.effect.toFixed(3),
                                      se: result.mediationResult.indirectEffect.bootSE.toFixed(3),
                                      t: "-",
                                      p: result.mediationResult.indirectEffect.significant ? "显著成立" : "不显著",
                                      ci: `[${result.mediationResult.indirectEffect.bootLLCI}, ${result.mediationResult.indirectEffect.bootULCI}]`,
                                    },
                                  ],
                                  note: "Bootstrap 抽样次数 = 1000。置信区间下限 LLCI 与上限 ULCI 不包含 0 表示中介效应具有统计学显著性。",
                                },
                              },
                            ]
                          : []),
                        {
                          heading: "三、测量模型信度与收敛效度评估",
                          table: {
                            caption: "表 3. 构念组合信度 (CR) 与平均方差提取量 (AVE)",
                            columns: [
                              { header: "构念名称", key: "construct" },
                              { header: "组合信度 CR (> 0.70)", key: "cr" },
                              { header: "平均方差提取量 AVE (> 0.50)", key: "ave" },
                              { header: "效度判定", key: "pass" },
                            ],
                            rows: result.reliability.map((r) => ({
                              construct: r.construct,
                              cr: r.cr.toFixed(3),
                              ave: r.ave.toFixed(3),
                              pass: r.cr >= 0.7 && r.ave >= 0.5 ? "达标" : "未达标",
                            })),
                            note: "标准参照 Fornell & Larcker (1981)；CR 推荐阈值为 0.70，AVE 推荐阈值为 0.50。",
                          },
                        },
                      ]}
                    />
                    <ResultsExporter
                      testLabel={selectedTemplate.name}
                      apa={{
                        test: `PROCESS Model ${selectedTemplate.modelNumber} (${selectedTemplate.category})`,
                        statistic: result.paths.map((p) => `${p.label}: β=${p.coefficient.toFixed(3)}`).join("; "),
                        p: result.paths.some((p) => p.p < 0.05) ? "< .05" : "≥ .05",
                        conclusion: result.interpretation,
                        interpretation: result.interpretation,
                      }}
                      stats={{ ...result.rSquared, ...result.diagnostics }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
