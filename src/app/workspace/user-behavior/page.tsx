"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, BarChart3, Download, Users, TrendingDown, Repeat, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { useHistoryStore } from "@/lib/api/history";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { cn } from "@/lib/utils";

type AnalysisMode = "funnel" | "retention" | "rfm" | "cohort" | "ai-insight";

const MODES: { id: AnalysisMode; label: string; icon: React.ElementType; desc: string; needsAI: boolean }[] = [
  { id: "funnel", label: "漏斗分析", icon: TrendingDown, desc: "事件序列转化率计算", needsAI: false },
  { id: "retention", label: "留存分析", icon: Repeat, desc: "按日/周/月计算用户留存率", needsAI: false },
  { id: "rfm", label: "RFM 分群", icon: Users, desc: "按消费频率/金额/最近购买分群", needsAI: false },
  { id: "cohort", label: "同期群分析", icon: Layers, desc: "按注册时间分组追踪行为", needsAI: false },
  { id: "ai-insight", label: "AI 洞察", icon: BarChart3, desc: "LLM 分析用户行为数据，输出策略建议", needsAI: true },
];

type CohortTableRow = {
  cohort: string;
  size: number;
  periods: Record<string, string>;
  counts: Record<string, number>;
};

const cohortPeriods = Array.from({ length: 9 }, (_, i) => `Week ${i}`);

function parseDateValue(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function extractPercent(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : Number.NaN;
}

export default function UserBehaviorPage() {
  const [mode, setMode] = useState<AnalysisMode>("funnel");
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [userCol, setUserCol] = useState("");
  const [eventCol, setEventCol] = useState("");
  const [timeCol, setTimeCol] = useState("");
  const [valueCol, setValueCol] = useState("");
  const [funnelSteps, setFunnelSteps] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { hasAnyKey } = useAPIStore();
  const { addRecord } = useHistoryStore();

  const saveRecord = (type: string, output: unknown) => {
    addRecord({
      tool: "user-behavior",
      type,
      input: fileData?.fileName ?? "事件日志",
      result: JSON.stringify(output),
    });
  };

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    setResult(null);
    setAiResult("");
    // Auto-detect columns
    const headers = data.headers;
    const lc = headers.map((h) => h.toLowerCase());
    const uid = headers.find((h, i) => /user|id|客户|用户|uid/i.test(lc[i])) ?? headers[0];
    const evt = headers.find((h, i) => /event|事件|action|行为|type/i.test(lc[i])) ?? headers[1] ?? headers[0];
    const ts = headers.find((h, i) => /time|date|日期|时间|timestamp|created/i.test(lc[i])) ?? headers[2] ?? headers[0];
    const val = headers.find((h, i) => /value|amount|金额|价值|revenue|price/i.test(lc[i]));
    setUserCol(uid);
    setEventCol(evt);
    setTimeCol(ts);
    if (val) setValueCol(val);
  };

  const handleRun = async () => {
    if (!fileData) return;
    setLoading(true);
    setResult(null);
    setAiResult("");

    try {
      if (mode === "funnel") {
        const steps = funnelSteps.split(",").map((s) => s.trim()).filter(Boolean);
        if (steps.length < 2) { setResult({ error: "请输入至少 2 个漏斗步骤（逗号分隔）" }); setLoading(false); return; }
        const userEvents = new Map<string, string[]>();
        for (const row of fileData.rows) {
          const uid = String(row[userCol]);
          const evt = String(row[eventCol]);
          if (!userEvents.has(uid)) userEvents.set(uid, []);
          userEvents.get(uid)!.push(evt);
        }
        const funnel: { step: string; users: number; rate: string }[] = [];
        let prevUsers: Set<string> | null = null;
        for (const step of steps) {
          const users = new Set<string>();
          for (const [uid, events] of userEvents) {
            if (events.includes(step)) users.add(uid);
          }
          const rate = prevUsers ? `${((users.size / prevUsers.size) * 100).toFixed(1)}%` : "100%";
          funnel.push({ step, users: users.size, rate });
          prevUsers = users;
        }
        const totalConversion = prevUsers ? ((prevUsers.size / (funnel[0]?.users ?? 1)) * 100).toFixed(1) : "0";
        const output = { funnel, total_conversion: `${totalConversion}%`, total_users: userEvents.size };
        setResult(output);
        saveRecord("漏斗分析", output);
      } else if (mode === "retention") {
        const userFirstSeen = new Map<string, Date>();
        const userDates = new Map<string, Set<string>>();
        for (const row of fileData.rows) {
          const uid = String(row[userCol]);
          const parsedDate = parseDateValue(row[timeCol]);
          if (!uid || !parsedDate) continue;
          const dateStr = parsedDate.toISOString().slice(0, 10);
          const previousDate = userFirstSeen.get(uid);
          if (!previousDate || parsedDate < previousDate) userFirstSeen.set(uid, parsedDate);
          if (!userDates.has(uid)) userDates.set(uid, new Set());
          userDates.get(uid)!.add(dateStr);
        }
        if (userFirstSeen.size === 0) throw new Error("时间列无法解析，请选择可识别的日期/时间列");
        const cohortMap = new Map<string, Set<string>>();
        for (const [uid, firstDate] of userFirstSeen) {
          const dateKey = firstDate.toISOString().slice(0, 10);
          if (!cohortMap.has(dateKey)) cohortMap.set(dateKey, new Set());
          cohortMap.get(dateKey)!.add(uid);
        }
        const sortedCohorts = [...cohortMap.keys()].sort().slice(0, 12);
        const retention: Record<string, Record<string, string>> = {};
        for (const cohort of sortedCohorts) {
          const cohortUsers = cohortMap.get(cohort)!;
          const cohortStart = new Date(cohort).getTime();
          retention[cohort] = { "Day 0": `${cohortUsers.size} (100%)` };
          for (let d = 1; d <= 7; d++) {
            const targetDate = new Date(cohortStart + d * 86400000).toISOString().slice(0, 10);
            let active = 0;
            for (const uid of cohortUsers) {
              if (userDates.get(uid)?.has(targetDate)) active++;
            }
            retention[cohort][`Day ${d}`] = `${((active / cohortUsers.size) * 100).toFixed(1)}%`;
          }
        }
        const output = { retention, cohorts_analyzed: sortedCohorts.length };
        setResult(output);
        saveRecord("留存分析", output);
      } else if (mode === "cohort") {
        const userDates = new Map<string, Date[]>();
        for (const row of fileData.rows) {
          const uid = String(row[userCol]);
          const parsedDate = parseDateValue(row[timeCol]);
          if (!uid || !parsedDate) continue;
          if (!userDates.has(uid)) userDates.set(uid, []);
          userDates.get(uid)!.push(parsedDate);
        }
        if (userDates.size === 0) throw new Error("时间列无法解析，请选择可识别的日期/时间列");

        const cohorts = new Map<string, { users: Set<string>; activeByWeek: Map<number, Set<string>> }>();
        for (const [uid, dates] of userDates) {
          const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
          const firstDate = sortedDates[0];
          const cohort = formatMonth(firstDate);
          if (!cohorts.has(cohort)) cohorts.set(cohort, { users: new Set(), activeByWeek: new Map() });
          const aggregate = cohorts.get(cohort)!;
          aggregate.users.add(uid);

          for (const date of sortedDates) {
            const week = Math.floor((date.getTime() - firstDate.getTime()) / (7 * 86400000));
            if (week < 0 || week > 8) continue;
            if (!aggregate.activeByWeek.has(week)) aggregate.activeByWeek.set(week, new Set());
            aggregate.activeByWeek.get(week)!.add(uid);
          }
        }

        const cohortTable: CohortTableRow[] = [...cohorts.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, 12)
          .map(([cohort, aggregate]) => {
            const size = aggregate.users.size || 1;
            const periods: Record<string, string> = {};
            const counts: Record<string, number> = {};
            cohortPeriods.forEach((period, week) => {
              const count = week === 0 ? aggregate.users.size : aggregate.activeByWeek.get(week)?.size ?? 0;
              counts[period] = count;
              periods[period] = week === 0 ? `${count} (100%)` : `${((count / size) * 100).toFixed(1)}%`;
            });
            return { cohort, size: aggregate.users.size, periods, counts };
          });

        const totalUsers = cohortTable.reduce((sum, row) => sum + row.size, 0);
        const weightedRetention = (period: string) => {
          const active = cohortTable.reduce((sum, row) => sum + (row.counts[period] ?? 0), 0);
          return totalUsers > 0 ? +((active / totalUsers) * 100).toFixed(1) : 0;
        };
        const bestCohort = [...cohortTable]
          .sort((a, b) => ((b.counts["Week 4"] ?? 0) / Math.max(b.size, 1)) - ((a.counts["Week 4"] ?? 0) / Math.max(a.size, 1)))[0];
        const output = {
          cohort_table: cohortTable,
          cohorts_analyzed: cohortTable.length,
          total_users: totalUsers,
          summary: {
            week_1_retention: `${weightedRetention("Week 1")}%`,
            week_4_retention: `${weightedRetention("Week 4")}%`,
            best_retention_cohort: bestCohort?.cohort ?? "—",
          },
        };
        setResult(output);
        saveRecord("同期群分析", output.summary);
      } else if (mode === "rfm") {
        const now = new Date();
        const userData = new Map<string, { lastPurchase: Date; frequency: number; monetary: number }>();
        for (const row of fileData.rows) {
          const uid = String(row[userCol]);
          const date = parseDateValue(row[timeCol]);
          if (!uid || !date) continue;
          const value = typeof row[valueCol] === "number" ? row[valueCol] as number : Number(row[valueCol]) || 1;
          if (!userData.has(uid)) userData.set(uid, { lastPurchase: date, frequency: 0, monetary: 0 });
          const u = userData.get(uid)!;
          if (date > u.lastPurchase) u.lastPurchase = date;
          u.frequency++;
          u.monetary += value;
        }
        const rfmData: { uid: string; recency: number; frequency: number; monetary: number; segment: string }[] = [];
        for (const [uid, d] of userData) {
          const recency = Math.floor((now.getTime() - d.lastPurchase.getTime()) / 86400000);
          const frequency = d.frequency;
          const monetary = d.monetary;
          let segment = "一般";
          if (recency <= 30 && frequency >= 5 && monetary >= 500) segment = "高价值";
          else if (recency <= 30 && frequency >= 5) segment = "活跃忠实";
          else if (recency <= 30) segment = "新客户";
          else if (recency <= 90 && frequency >= 3) segment = "潜力客户";
          else if (recency > 90 && frequency >= 5) segment = "流失风险";
          else if (recency > 180) segment = "已流失";
          rfmData.push({ uid, recency, frequency, monetary: +monetary.toFixed(2), segment });
        }
        if (rfmData.length === 0) throw new Error("时间列无法解析，请选择可识别的日期/时间列");
        const segments: Record<string, number> = {};
        for (const r of rfmData) segments[r.segment] = (segments[r.segment] || 0) + 1;
        const output = {
          total_users: rfmData.length,
          segments,
          avg_recency: +(rfmData.reduce((s, r) => s + r.recency, 0) / rfmData.length).toFixed(1),
          avg_frequency: +(rfmData.reduce((s, r) => s + r.frequency, 0) / rfmData.length).toFixed(1),
          avg_monetary: +(rfmData.reduce((s, r) => s + r.monetary, 0) / rfmData.length).toFixed(2),
          top_users: rfmData.sort((a, b) => b.monetary - a.monetary).slice(0, 10).map((r) => ({ uid: r.uid, segment: r.segment, monetary: r.monetary, frequency: r.frequency, recency_days: r.recency })),
        };
        setResult(output);
        saveRecord("RFM 分群", { total_users: output.total_users, segments: output.segments });
      } else if (mode === "ai-insight") {
        if (!hasAnyKey()) { setResult({ error: "请先配置 API Key" }); setLoading(false); return; }
        const sample = fileData.rows.slice(0, 50).map((r) => JSON.stringify(r)).join("\n");
        const res = await callLLM({
          messages: [
            { role: "system", content: "你是一个用户行为分析专家。根据以下用户行为数据，输出：1) 关键发现 3-5 条 2) 用户分群建议 3) 转化优化建议 4) 流失预警。用中文输出，结构化为 JSON。" },
            { role: "user", content: `列名: ${fileData.headers.join(", ")}\n数据样本（前50行）:\n${sample}` },
          ],
          temperature: 0.3,
          maxTokens: 3000,
          stream: true,
          onChunk: (text) => setAiResult((prev) => prev + text),
        });
        if (!aiResult) setAiResult(res);
        addRecord({ tool: "user-behavior", type: "AI 洞察", input: fileData.fileName, result: res || aiResult });
      }
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : "分析失败" });
    } finally {
      setLoading(false);
    }
  };

  const numCols = fileData ? fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number")) : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-xl">📊</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">用户行为分析</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 ZenGrowth · Istari · E-commerce Consumer Analysis</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">上传用户行为数据（事件日志），自动完成漏斗/留存/RFM/同期群分析</p>

        {/* Mode selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setAiResult(""); }}
              className={cn("px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5",
                mode === m.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              )}>
              <m.icon className="w-3.5 h-3.5" /> {m.label}
              {m.needsAI && <span className="text-[9px] text-[var(--warning)]">AI</span>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <FileUpload onUpload={handleFileUpload} description="CSV / JSON，每行一条事件记录" />

            {fileData && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{fileData.fileName}</span>
                  <Badge variant="outline" className="text-[10px]">{fileData.rowCount} 行 × {fileData.colCount} 列</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">用户 ID 列</label>
                    <select value={userCol} onChange={(e) => setUserCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">事件列</label>
                    <select value={eventCol} onChange={(e) => setEventCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">时间列</label>
                    <select value={timeCol} onChange={(e) => setTimeCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      {fileData.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">金额列（可选）</label>
                    <select value={valueCol} onChange={(e) => setValueCol(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                      <option value="">无</option>
                      {numCols.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                {mode === "funnel" && (
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">漏斗步骤（逗号分隔，按顺序）</label>
                    <input value={funnelSteps} onChange={(e) => setFunnelSteps(e.target.value)}
                      placeholder="view, click, add_to_cart, purchase"
                      className="w-full h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]" />
                  </div>
                )}

                <Button onClick={handleRun} disabled={loading || !fileData}
                  className="w-full h-10 bg-[var(--primary)] text-white hover:opacity-90">
                  {loading ? "分析中..." : <><Play className="w-4 h-4 mr-2" /> 开始分析</>}
                </Button>
              </div>
            )}
            <HistoryPanel tool="user-behavior" />
          </div>

          {/* Output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--text-tertiary)]">分析结果</label>
              {result && !result.error && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `behavior-${mode}-${Date.now()}.json`; a.click();
                }}>
                  <Download className="w-3 h-3 mr-1" /> JSON
                </Button>
              )}
            </div>

            <div className="glass-card p-6 min-h-[400px] max-h-[700px] overflow-y-auto">
              {/* Funnel result */}
              {mode === "funnel" && result && !result.error && Array.isArray(result.funnel) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">漏斗转化</span>
                    <Badge variant="outline" className="border-[var(--success)]/30 text-[var(--success)]">总转化 {String(result.total_conversion)}</Badge>
                  </div>
                  {(result.funnel as { step: string; users: number; rate: string }[]).map((s, i) => {
                    const pct = (s.users / ((result.funnel as { step: string; users: number }[])[0]?.users ?? 1)) * 100;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-primary)]">{s.step}</span>
                          <span className="text-[var(--text-secondary)]">{s.users} 用户 {i > 0 && `(${s.rate})`}</span>
                        </div>
                        <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-[var(--text-muted)] mt-2">共 {String(result.total_users)} 个独立用户</p>
                </div>
              )}

              {/* Retention result */}
              {mode === "retention" && result && !result.error && result.retention && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left py-2 px-2 text-[var(--text-muted)]">群组</th>
                        {["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"].map((d) => (
                          <th key={d} className="text-center py-2 px-2 text-[var(--text-muted)]">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.retention as Record<string, Record<string, string>>).map(([cohort, days]) => (
                        <tr key={cohort} className="border-b border-[var(--border)]">
                          <td className="py-2 px-2 text-[var(--text-primary)] font-mono">{cohort}</td>
                          {["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"].map((d) => {
                            const val = days[d] ?? "—";
                            const numVal = parseFloat(val);
                            const bg = !isNaN(numVal) ? numVal > 50 ? "bg-[var(--success)]/20" : numVal > 20 ? "bg-[var(--warning)]/20" : "bg-[var(--error)]/10" : "";
                            return <td key={d} className={cn("text-center py-2 px-2 text-[var(--text-secondary)]", bg)}>{val}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cohort result */}
              {mode === "cohort" && result && !result.error && Array.isArray(result.cohort_table) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">{String(result.cohorts_analyzed)}</div>
                      <div className="text-xs text-[var(--text-muted)]">同期群</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">{String((result.summary as Record<string, string>)?.week_1_retention ?? "—")}</div>
                      <div className="text-xs text-[var(--text-muted)]">Week 1 留存</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">{String((result.summary as Record<string, string>)?.best_retention_cohort ?? "—")}</div>
                      <div className="text-xs text-[var(--text-muted)]">最佳群组</div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="text-left py-2 px-2 text-[var(--text-muted)]">首次活跃月份</th>
                          <th className="text-right py-2 px-2 text-[var(--text-muted)]">用户</th>
                          {cohortPeriods.map((period) => (
                            <th key={period} className="text-center py-2 px-2 text-[var(--text-muted)]">{period}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(result.cohort_table as CohortTableRow[]).map((row) => (
                          <tr key={row.cohort} className="border-b border-[var(--border)]">
                            <td className="py-2 px-2 text-[var(--text-primary)] font-mono">{row.cohort}</td>
                            <td className="py-2 px-2 text-[var(--text-secondary)] text-right">{row.size}</td>
                            {cohortPeriods.map((period) => {
                              const val = row.periods[period] ?? "—";
                              const numVal = extractPercent(val);
                              const bg = !isNaN(numVal) ? numVal >= 50 ? "bg-[var(--success)]/20" : numVal >= 20 ? "bg-[var(--warning)]/20" : "bg-[var(--error)]/10" : "";
                              return <td key={period} className={cn("text-center py-2 px-2 text-[var(--text-secondary)]", bg)}>{val}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RFM result */}
              {mode === "rfm" && result && !result.error && result.segments && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">{String(result.avg_recency)}</div>
                      <div className="text-xs text-[var(--text-muted)]">平均 R (天)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">{String(result.avg_frequency)}</div>
                      <div className="text-xs text-[var(--text-muted)]">平均 F (次)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[var(--text-primary)]">{String(result.avg_monetary)}</div>
                      <div className="text-xs text-[var(--text-muted)]">平均 M</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--text-primary)] mb-2 block">用户分群</span>
                    {Object.entries(result.segments as Record<string, number>).map(([seg, count]) => {
                      const pct = ((count as number) / (result.total_users as number)) * 100;
                      return (
                        <div key={seg} className="flex items-center gap-3 mb-1">
                          <span className="text-xs text-[var(--text-secondary)] w-16 shrink-0">{seg}</span>
                          <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-mono text-[var(--text-muted)] w-12 text-right">{count as number}</span>
                        </div>
                      );
                    })}
                  </div>
                  {result.top_users && (
                    <div>
                      <span className="text-sm font-medium text-[var(--text-primary)] mb-2 block">Top 10 高价值用户</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="border-b border-[var(--border)]">
                            <th className="text-left py-1 px-2 text-[var(--text-muted)]">用户</th>
                            <th className="text-left py-1 px-2 text-[var(--text-muted)]">分群</th>
                            <th className="text-right py-1 px-2 text-[var(--text-muted)]">消费</th>
                            <th className="text-right py-1 px-2 text-[var(--text-muted)]">频次</th>
                            <th className="text-right py-1 px-2 text-[var(--text-muted)]">最近(天)</th>
                          </tr></thead>
                          <tbody>{(result.top_users as { uid: string; segment: string; monetary: number; frequency: number; recency_days: number }[]).map((u, i) => (
                            <tr key={i} className="border-b border-[var(--border)]">
                              <td className="py-1 px-2 text-[var(--text-primary)] font-mono">{u.uid}</td>
                              <td className="py-1 px-2 text-[var(--text-secondary)]">{u.segment}</td>
                              <td className="py-1 px-2 text-[var(--text-primary)] text-right">{u.monetary}</td>
                              <td className="py-1 px-2 text-[var(--text-secondary)] text-right">{u.frequency}</td>
                              <td className="py-1 px-2 text-[var(--text-secondary)] text-right">{u.recency_days}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI result */}
              {mode === "ai-insight" && aiResult && (
                <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans leading-relaxed">{aiResult}</pre>
              )}

              {/* Error */}
              {result?.error && <div className="text-[var(--error)] text-sm">{result.error as string}</div>}

              {/* Empty state */}
              {!result && !aiResult && (
                <div className="text-[var(--text-muted)] text-sm text-center py-20">
                  <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>上传数据文件，选择分析模式</p>
                  <p className="text-xs mt-1">支持 CSV / JSON 格式的用户事件日志</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
