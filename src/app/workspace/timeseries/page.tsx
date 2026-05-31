"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { ChartExportWrapper } from "@/components/charts/chart-export-wrapper";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";

interface DecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  original: number[];
  labels: string[];
  forecast: { label: string; value: number; lower: number; upper: number }[];
  anomalies: { index: number; label: string; value: number; residual: number; z: number }[];
  stats: {
    mean: number;
    std: number;
    trend_direction: string;
    seasonality_strength: number;
    autocorrelation: number;
    anomaly_count: number;
    forecast_horizon: number;
  };
}

function decompose(data: number[], period: number = 7, inputLabels?: string[]): DecompositionResult {
  const n = data.length;
  const trend: number[] = [];
  const seasonal: number[] = [];
  const residual: number[] = [];

  // Moving average trend
  const halfP = Math.floor(period / 2);
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - halfP);
    const end = Math.min(n, i + halfP + 1);
    const window = data.slice(start, end);
    trend.push(window.reduce((s, v) => s + v, 0) / window.length);
  }

  // Seasonal component (average deviation per position in cycle)
  const detrended = data.map((v, i) => v - trend[i]);
  const seasonalAvg: number[] = new Array(period).fill(0);
  const seasonalCount: number[] = new Array(period).fill(0);
  for (let i = 0; i < n; i++) {
    const pos = i % period;
    seasonalAvg[pos] += detrended[i];
    seasonalCount[pos]++;
  }
  for (let i = 0; i < period; i++) {
    seasonalAvg[i] = seasonalCount[i] > 0 ? seasonalAvg[i] / seasonalCount[i] : 0;
  }
  for (let i = 0; i < n; i++) {
    seasonal.push(seasonalAvg[i % period]);
  }

  // Residual
  for (let i = 0; i < n; i++) {
    residual.push(data[i] - trend[i] - seasonal[i]);
  }

  // Stats
  const m = data.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(data.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1));
  const trendStart = trend.slice(0, Math.min(10, n)).reduce((s, v) => s + v, 0) / Math.min(10, n);
  const trendEnd = trend.slice(-Math.min(10, n)).reduce((s, v) => s + v, 0) / Math.min(10, n);
  const trendDir = trendEnd > trendStart * 1.05 ? "上升" : trendEnd < trendStart * 0.95 ? "下降" : "平稳";
  const seasonalVar = seasonalAvg.reduce((s, v) => s + v ** 2, 0);
  const totalVar = data.reduce((s, v) => s + (v - m) ** 2, 0);
  const seasonalityStrength = totalVar > 0 ? Math.min(1, seasonalVar / (totalVar / n)) : 0;

  // Autocorrelation (lag-1)
  let num = 0, d1 = 0, d2 = 0;
  for (let i = 1; i < n; i++) {
    const a = data[i] - m, b = data[i - 1] - m;
    num += a * b; d1 += a * a; d2 += b * b;
  }
  const acf1 = d1 > 0 && d2 > 0 ? num / Math.sqrt(d1 * d2) : 0;

  const residualMean = residual.reduce((s, v) => s + v, 0) / n;
  const residualStd = Math.sqrt(residual.reduce((s, v) => s + (v - residualMean) ** 2, 0) / Math.max(1, n - 1)) || sd || 1;
  const labels = inputLabels?.length === n ? inputLabels : data.map((_, i) => `T${i + 1}`);
  const anomalies = residual
    .map((r, i) => ({ index: i, label: labels[i], value: data[i], residual: +r.toFixed(2), z: +((r - residualMean) / residualStd).toFixed(2) }))
    .filter((item) => Math.abs(item.z) >= 2.5)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, 10);
  const horizon = Math.min(12, Math.max(4, period));
  const slopeBase = Math.max(0, n - Math.max(2, period));
  const slope = (trend[n - 1] - trend[slopeBase]) / Math.max(1, n - 1 - slopeBase);
  const forecast = Array.from({ length: horizon }, (_, i) => {
    const step = i + 1;
    const value = trend[n - 1] + slope * step + seasonalAvg[(n + i) % period];
    const interval = 1.96 * residualStd * Math.sqrt(1 + step / horizon);
    return {
      label: `F${step}`,
      value: +value.toFixed(2),
      lower: +(value - interval).toFixed(2),
      upper: +(value + interval).toFixed(2),
    };
  });

  return {
    trend, seasonal, residual, original: data, labels, forecast, anomalies,
    stats: {
      mean: +m.toFixed(2),
      std: +sd.toFixed(2),
      trend_direction: trendDir,
      seasonality_strength: +seasonalityStrength.toFixed(3),
      autocorrelation: +acf1.toFixed(3),
      anomaly_count: anomalies.length,
      forecast_horizon: horizon,
    },
  };
}

export default function TimeSeriesPage() {
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [valueCol, setValueCol] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [period, setPeriod] = useState(7);
  const [result, setResult] = useState<DecompositionResult | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    setResult(null);
    const numCols = data.headers.filter((h) => data.rows.some((r) => typeof r[h] === "number"));
    if (numCols.length > 0) setValueCol(numCols[numCols.length - 1]);
    const dateC = data.headers.find((h) => /date|time|日期/i.test(h));
    if (dateC) setDateCol(dateC);
  };

  const handleRun = () => {
    if (!fileData || !valueCol) return;
    const rows = [...fileData.rows].sort((a, b) => {
      if (!dateCol) return 0;
      return new Date(String(a[dateCol])).getTime() - new Date(String(b[dateCol])).getTime();
    });
    const validRows = rows.filter((r) => typeof r[valueCol] === "number");
    const values = validRows.map((r) => r[valueCol]).filter((v): v is number => typeof v === "number");
    if (values.length < 10) return;
    const labels = validRows.map((r, i) => dateCol ? String(r[dateCol]).slice(0, 10) : `T${i + 1}`);
    const res = decompose(values, period, labels);
    setResult(res);
    addRecord({ tool: "timeseries", type: "时间序列分解", input: `${fileData.fileName} (${valueCol})`, result: JSON.stringify(res.stats) });
  };

  const handleAI = async () => {
    if (!result || !hasAnyKey()) return;
    setLoading(true);
    setAiResult("");
    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: "你是一个时间序列分析专家。根据分解结果，输出：1) 趋势解读 2) 季节性模式分析 3) 异常点识别 4) 预测建议 5) 业务行动建议。用中文输出。" },
          { role: "user", content: JSON.stringify(result.stats) },
        ],
        stream: true, onChunk: (t) => setAiResult((prev) => prev + t),
      });
      if (!aiResult) setAiResult(res);
    } catch (e: unknown) { setAiResult(`错误: ${e instanceof Error ? e.message : "未知错误"}`); }
    setLoading(false);
  };

  const chartData = result ? result.labels.map((label, i) => ({
    label,
    original: result.original[i],
    trend: +result.trend[i].toFixed(2),
    seasonal: +result.seasonal[i].toFixed(2),
    residual: +result.residual[i].toFixed(2),
  })) : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-xl">📈</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">时间序列分析</h1>
            <p className="text-sm text-[var(--text-muted)]">趋势分解 · 季节性检测 · 因果影响评估 · 预测</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">上传时间序列数据 → 自动分解为趋势+季节+残差 → AI 解读 → 生成预测建议</p>
        <ActiveProviderBadge className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FileUpload onUpload={handleFileUpload} description="CSV，包含时间列和数值列" />

            {fileData && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{fileData.fileName}</span>
                  <Badge variant="outline" className="text-[10px]">{fileData.rowCount} 行</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">时间列</label>
                    <select value={dateCol} onChange={(e) => setDateCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      <option value="">按原顺序</option>
                      {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">数值列</label>
                    <select value={valueCol} onChange={(e) => setValueCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      {fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number")).map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">周期长度</label>
                    <Input type="number" value={period} onChange={(e) => setPeriod(Number(e.target.value) || 7)}
                      className="h-8 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleRun} disabled={!valueCol}
                      className="w-full h-8 bg-[var(--primary)] text-white text-xs">
                      <Play className="w-3 h-3 mr-1" /> 分解
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">周期长度：日数据=7(周)，月数据=12(年)，按实际业务周期调整</p>
              </div>
            )}

            {result && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">统计摘要</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "均值", value: result.stats.mean },
                    { label: "标准差", value: result.stats.std },
                    { label: "趋势方向", value: result.stats.trend_direction },
                    { label: "季节强度", value: result.stats.seasonality_strength },
                    { label: "自相关(1)", value: result.stats.autocorrelation },
                    { label: "异常点", value: result.stats.anomaly_count },
                    { label: "预测步数", value: result.stats.forecast_horizon },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
                      <span className="text-xs text-[var(--text-tertiary)]">{m.label}</span>
                      <span className="text-xs font-mono text-[var(--text-primary)]">{String(m.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleAI} disabled={!result || loading || !hasAnyKey()}
              variant="outline" className="w-full h-10 border-[var(--border)] text-[var(--text-secondary)]">
              {loading ? "分析中..." : "AI 解读时间序列"}
            </Button>

            <HistoryPanel tool="timeseries" />
          </div>

          <div className="space-y-4">
            {result ? (
              <>
                {/* Original + Trend */}
                <ChartExportWrapper filename="timeseries-original-trend">
                  <div className="glass-card p-4">
                    <span className="text-xs text-[var(--text-muted)] mb-2 block">原始数据 + 趋势</span>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                        <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="original" stroke="#6366F1" fill="#6366F1" fillOpacity={0.1} strokeWidth={1.5} />
                        <Line type="monotone" dataKey="trend" stroke="#F59E0B" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartExportWrapper>

                {/* Seasonal */}
                <ChartExportWrapper filename="timeseries-seasonal">
                  <div className="glass-card p-4">
                    <span className="text-xs text-[var(--text-muted)] mb-2 block">季节性成分</span>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                        <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                        <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" />
                        <Area type="monotone" dataKey="seasonal" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartExportWrapper>

                {/* Residual */}
                <ChartExportWrapper filename="timeseries-residual">
                  <div className="glass-card p-4">
                    <span className="text-xs text-[var(--text-muted)] mb-2 block">残差（异常信号）</span>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 10 }} interval={Math.max(1, Math.floor(chartData.length / 8))} />
                        <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                        <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" />
                        <Area type="monotone" dataKey="residual" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartExportWrapper>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-4">
                    <span className="text-xs text-[var(--text-muted)] mb-2 block">预测区间</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            <th className="text-left py-2 px-2 text-[var(--text-muted)]">步数</th>
                            <th className="text-right py-2 px-2 text-[var(--text-muted)]">预测值</th>
                            <th className="text-right py-2 px-2 text-[var(--text-muted)]">下界</th>
                            <th className="text-right py-2 px-2 text-[var(--text-muted)]">上界</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.forecast.map((row) => (
                            <tr key={row.label} className="border-b border-[var(--border)]">
                              <td className="py-1.5 px-2 text-[var(--text-primary)] font-mono">{row.label}</td>
                              <td className="py-1.5 px-2 text-right text-[var(--text-primary)]">{row.value}</td>
                              <td className="py-1.5 px-2 text-right text-[var(--text-secondary)]">{row.lower}</td>
                              <td className="py-1.5 px-2 text-right text-[var(--text-secondary)]">{row.upper}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="glass-card p-4">
                    <span className="text-xs text-[var(--text-muted)] mb-2 block">异常点检测</span>
                    {result.anomalies.length > 0 ? (
                      <div className="space-y-2">
                        {result.anomalies.map((row) => (
                          <div key={`${row.label}-${row.index}`} className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
                            <div>
                              <div className="text-xs font-mono text-[var(--text-primary)]">{row.label}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">残差 {row.residual}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-[var(--text-secondary)]">{row.value}</div>
                              <div className="text-[10px] text-[var(--error)]">z={row.z}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] py-4">未发现 |z| ≥ 2.5 的残差异常点</p>
                    )}
                  </div>
                </div>

                {/* AI interpretation */}
                {aiResult && (
                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-[var(--primary)] mb-2">AI 解读</h3>
                    <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{aiResult}</pre>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-6 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-[var(--text-muted)]">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>上传时间序列数据，点击“分解”</p>
                  <p className="text-xs mt-1">自动分解为趋势 + 季节性 + 残差</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
