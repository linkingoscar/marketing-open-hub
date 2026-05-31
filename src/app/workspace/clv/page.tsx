"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function calcRFM(data: Record<string, string | number>[], customerIdCol: string, dateCol: string, amountCol: string) {
  const customers = new Map<string, { firstPurchase: Date; lastPurchase: Date; frequency: number; monetary: number }>();
  let asOf = new Date(0);

  for (const row of data) {
    const cid = String(row[customerIdCol]);
    const date = new Date(String(row[dateCol]));
    if (!cid || Number.isNaN(date.getTime())) continue;
    const amount = typeof row[amountCol] === "number" ? row[amountCol] as number : Number(row[amountCol]) || 1;
    if (date > asOf) asOf = date;
    if (!customers.has(cid)) customers.set(cid, { firstPurchase: date, lastPurchase: date, frequency: 0, monetary: 0 });
    const c = customers.get(cid)!;
    if (date < c.firstPurchase) c.firstPurchase = date;
    if (date > c.lastPurchase) c.lastPurchase = date;
    c.frequency++;
    c.monetary += amount;
  }

  const rfm = [...customers.entries()].map(([id, d]) => ({
    customer_id: id,
    recency: Math.floor((asOf.getTime() - d.lastPurchase.getTime()) / 86400000),
    frequency: d.frequency,
    monetary: +d.monetary.toFixed(2),
    first_purchase: d.firstPurchase,
    last_purchase: d.lastPurchase,
  }));
  if (rfm.length === 0) throw new Error("未找到可解析的客户交易记录");

  const recencySorted = [...rfm].sort((a, b) => a.recency - b.recency);
  const frequencySorted = [...rfm].sort((a, b) => b.frequency - a.frequency);
  const monetarySorted = [...rfm].sort((a, b) => b.monetary - a.monetary);
  const n = rfm.length;
  const rScore = (val: number) => { const idx = recencySorted.findIndex((r) => r.recency === val); return idx < n * 0.2 ? 5 : idx < n * 0.4 ? 4 : idx < n * 0.6 ? 3 : idx < n * 0.8 ? 2 : 1; };
  const fScore = (val: number) => { const idx = frequencySorted.findIndex((r) => r.frequency === val); return idx < n * 0.2 ? 5 : idx < n * 0.4 ? 4 : idx < n * 0.6 ? 3 : idx < n * 0.8 ? 2 : 1; };
  const mScore = (val: number) => { const idx = monetarySorted.findIndex((r) => r.monetary === val); return idx < n * 0.2 ? 5 : idx < n * 0.4 ? 4 : idx < n * 0.6 ? 3 : idx < n * 0.8 ? 2 : 1; };

  const scored = rfm.map((r) => {
    const activeDays = Math.max(1, Math.ceil((r.last_purchase.getTime() - r.first_purchase.getTime()) / 86400000));
    const avgOrderValue = r.monetary / Math.max(1, r.frequency);
    const monthlyPurchaseRate = r.frequency / Math.max(1, activeDays / 30);
    const expectedGap = r.frequency > 1 ? activeDays / (r.frequency - 1) : 90;
    const riskRatio = r.recency / Math.max(30, expectedGap * 2);
    const churn_risk = riskRatio >= 0.75 ? "高" : riskRatio >= 0.45 ? "中" : "低";
    const r_score = rScore(r.recency);
    const f_score = fScore(r.frequency);
    const m_score = mScore(r.monetary);
    const rfm_score = r_score + f_score + m_score;
    const segment = rfm_score >= 13 ? "冠军" : rfm_score >= 10 ? "忠实客户" : rfm_score >= 7 ? "潜力客户" : rfm_score >= 4 ? "风险客户" : "流失客户";
    return {
      customer_id: r.customer_id,
      recency: r.recency,
      frequency: r.frequency,
      monetary: r.monetary,
      r_score,
      f_score,
      m_score,
      rfm_score,
      segment,
      avg_order_value: +avgOrderValue.toFixed(2),
      clv_12m: +(avgOrderValue * monthlyPurchaseRate * 12).toFixed(2),
      churn_risk,
      expected_gap_days: +expectedGap.toFixed(1),
    };
  });

  const segments: Record<string, number> = {};
  const churnRisk: Record<string, number> = {};
  for (const s of scored) {
    segments[s.segment] = (segments[s.segment] || 0) + 1;
    churnRisk[s.churn_risk] = (churnRisk[s.churn_risk] || 0) + 1;
  }
  const totalPredictedClv = scored.reduce((sum, item) => sum + item.clv_12m, 0);

  return {
    total_customers: n,
    segments,
    churn_risk: churnRisk,
    avg_recency: +(rfm.reduce((s, r) => s + r.recency, 0) / n).toFixed(1),
    avg_frequency: +(rfm.reduce((s, r) => s + r.frequency, 0) / n).toFixed(1),
    avg_monetary: +(rfm.reduce((s, r) => s + r.monetary, 0) / n).toFixed(2),
    total_predicted_clv: +totalPredictedClv.toFixed(2),
    avg_predicted_clv: +(totalPredictedClv / n).toFixed(2),
    top_10: [...scored].sort((a, b) => b.rfm_score - a.rfm_score).slice(0, 10),
    top_clv: [...scored].sort((a, b) => b.clv_12m - a.clv_12m).slice(0, 10),
    churn_alerts: scored.filter((c) => c.churn_risk === "高").sort((a, b) => b.recency - a.recency).slice(0, 10),
  };
}

export default function CLVPage() {
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [customerIdCol, setCustomerIdCol] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [result, setResult] = useState<ReturnType<typeof calcRFM> | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    setResult(null);
    const headers = data.headers;
    const lc = headers.map((h) => h.toLowerCase());
    setCustomerIdCol(headers.find((h, i) => /customer|user|id|客户/i.test(lc[i])) ?? headers[0]);
    setDateCol(headers.find((h, i) => /date|time|日期|时间/i.test(lc[i])) ?? headers[1] ?? headers[0]);
    setAmountCol(headers.find((h, i) => /amount|revenue|price|value|金额|消费/i.test(lc[i])) ?? headers[2] ?? headers[0]);
  };

  const handleRun = () => {
    if (!fileData) return;
    setLoading(true);
    try {
      const res = calcRFM(fileData.rows, customerIdCol, dateCol, amountCol);
      setResult(res);
      addRecord({ tool: "clv", type: "RFM 分析", input: fileData.fileName, result: JSON.stringify(res.segments) });
    } catch { setResult(null); }
    setLoading(false);
  };

  const handleAI = async () => {
    if (!result || !hasAnyKey()) return;
    setLoading(true);
    setAiResult("");
    try {
      const res = await callLLM({
        messages: [
          { role: "system", content: "你是一个客户价值分析专家。根据 RFM 分析结果，输出：1) 客户分群解读 2) 针对每个分群的营销策略建议 3) CLV 提升方案 4) 流失预警建议。用中文输出，结构化为 JSON。" },
          { role: "user", content: JSON.stringify(result) },
        ],
        stream: true, onChunk: (t) => setAiResult((prev) => prev + t),
      });
      if (!aiResult) setAiResult(res);
    } catch (e: unknown) { setAiResult(`错误: ${e instanceof Error ? e.message : "未知错误"}`); }
    setLoading(false);
  };

  const segmentData = result ? Object.entries(result.segments).map(([name, count]) => ({ name, count })) : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center text-xl">💰</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">客户价值分析 (CLV)</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 Lifetimes · PyMC-Marketing · RFM 方法论</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">上传交易数据 → 自动计算 RFM/CLV → 客户分群 → 流失预警 → AI 生成营销策略</p>
        <ActiveProviderBadge className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FileUpload onUpload={handleFileUpload} description="CSV，需包含客户ID、交易日期、金额列" />

            {fileData && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{fileData.fileName}</span>
                  <Badge variant="outline" className="text-[10px]">{fileData.rowCount} 行</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">客户 ID 列</label>
                    <select value={customerIdCol} onChange={(e) => setCustomerIdCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">日期列</label>
                    <select value={dateCol} onChange={(e) => setDateCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">金额列</label>
                    <select value={amountCol} onChange={(e) => setAmountCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={handleRun} disabled={loading || !fileData}
                  className="w-full h-10 bg-[var(--primary)] text-white hover:opacity-90">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 计算中...</> : <><Play className="w-4 h-4 mr-2" /> 运行 RFM / CLV 分析</>}
                </Button>
              </div>
            )}
            <HistoryPanel tool="clv" />
          </div>

          <div className="space-y-4">
            {result && (
              <>
                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">客户分群</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={segmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div className="text-center"><div className="text-lg font-bold text-[var(--text-primary)]">{result.avg_recency}</div><div className="text-[10px] text-[var(--text-muted)]">平均 R (天)</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-[var(--text-primary)]">{result.avg_frequency}</div><div className="text-[10px] text-[var(--text-muted)]">平均 F (次)</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-[var(--text-primary)]">{result.avg_monetary}</div><div className="text-[10px] text-[var(--text-muted)]">平均 M (元)</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-[var(--text-primary)]">{result.avg_predicted_clv}</div><div className="text-[10px] text-[var(--text-muted)]">平均 12M CLV</div></div>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Top 10 高价值客户</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[var(--border)]">
                        <th className="text-left py-1.5 px-2 text-[var(--text-muted)]">ID</th>
                        <th className="text-left py-1.5 px-2 text-[var(--text-muted)]">分群</th>
                        <th className="text-right py-1.5 px-2 text-[var(--text-muted)]">RFM</th>
                        <th className="text-right py-1.5 px-2 text-[var(--text-muted)]">12M CLV</th>
                        <th className="text-right py-1.5 px-2 text-[var(--text-muted)]">流失风险</th>
                      </tr></thead>
                      <tbody>{result.top_10.map((c) => (
                        <tr key={c.customer_id} className="border-b border-[var(--border)]">
                          <td className="py-1.5 px-2 font-mono text-[var(--text-primary)]">{c.customer_id}</td>
                          <td className="py-1.5 px-2 text-[var(--text-secondary)]">{c.segment}</td>
                          <td className="text-right py-1.5 px-2 font-bold text-[var(--primary)]">{c.rfm_score}</td>
                          <td className="text-right py-1.5 px-2 text-[var(--text-primary)]">{c.clv_12m}</td>
                          <td className="text-right py-1.5 px-2 text-[var(--text-secondary)]">{c.churn_risk}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">流失预警</h3>
                    <div className="flex gap-2 text-[10px] text-[var(--text-muted)]">
                      {Object.entries(result.churn_risk).map(([risk, count]) => <span key={risk}>{risk}: {count}</span>)}
                    </div>
                  </div>
                  {result.churn_alerts.length > 0 ? (
                    <div className="space-y-2">
                      {result.churn_alerts.map((c) => (
                        <div key={c.customer_id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2">
                          <div>
                            <div className="text-xs font-mono text-[var(--text-primary)]">{c.customer_id}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{c.segment} · 最近 {c.recency} 天未购买</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-[var(--text-primary)]">CLV {c.clv_12m}</div>
                            <div className="text-[10px] text-[var(--error)]">高风险</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">未发现高风险客户</p>
                  )}
                </div>

                <Button onClick={handleAI} disabled={loading || !hasAnyKey()}
                  variant="outline" className="w-full h-10 border-[var(--border)] text-[var(--text-secondary)]">
                  <TrendingUp className="w-4 h-4 mr-2" /> AI 生成营销策略建议
                </Button>

                {aiResult && (
                  <div className="glass-card p-4">
                    <h3 className="text-sm font-medium text-[var(--primary)] mb-2">AI 营销策略建议</h3>
                    <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{aiResult}</pre>
                  </div>
                )}
              </>
            )}

            {!result && (
              <div className="glass-card p-6 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-[var(--text-muted)]">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>上传交易数据，运行 RFM 分析</p>
                  <p className="text-xs mt-1">自动计算客户生命周期价值并分群</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
