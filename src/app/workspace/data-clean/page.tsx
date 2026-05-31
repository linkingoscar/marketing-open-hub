"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calculator, RefreshCw, Wand2, ArrowDownUp, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { cn } from "@/lib/utils";

type CleaningAction = "composite" | "reverse" | "missing" | "outliers" | "rename";

const ACTIONS: { id: CleaningAction; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "composite", label: "计算构念得分", icon: Calculator, desc: "多题项合并为均值（如 trust_1~5 → trust_score）" },
  { id: "reverse", label: "反向题 Recode", icon: RefreshCw, desc: "反转量表值（1→7, 2→6, ... 7→1）" },
  { id: "missing", label: "缺失值处理", icon: Wand2, desc: "删除含缺失行 / 均值插补 / 中位数插补" },
  { id: "outliers", label: "异常值检测", icon: ArrowDownUp, desc: "基于 IQR 方法标记异常值" },
  { id: "rename", label: "列名管理", icon: RefreshCw, desc: "重命名列、删除列、排序" },
];

export default function DataCleanPage() {
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [action, setAction] = useState<CleaningAction>("composite");
  const [resultData, setResultData] = useState<ParsedData | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // Composite score state
  const [compositeName, setCompositeName] = useState("");
  const [compositeCols, setCompositeCols] = useState<string[]>([]);

  // Reverse state
  const [reverseCol, setReverseCol] = useState("");
  const [scaleMax, setScaleMax] = useState(7);

  // Missing state
  const [missingStrategy, setMissingStrategy] = useState<"drop" | "mean" | "median">("mean");
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [droppedCols, setDroppedCols] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleFileUpload = (data: ParsedData) => {
    setFileData(data);
    setResultData(null);
    setLog([]);
    setRenameMap(Object.fromEntries(data.headers.map((h) => [h, h])));
    setDroppedCols([]);
    addLog(`已加载 ${data.fileName}（${data.rowCount} 行 × ${data.colCount} 列）`);
  };

  const handleComposite = () => {
    if (!fileData || !compositeName.trim() || compositeCols.length < 2) return;
    const newRows = fileData.rows.map((row) => {
      const vals = compositeCols.map((c) => row[c]).filter((v): v is number => typeof v === "number");
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      return { ...row, [compositeName]: avg !== null ? +avg.toFixed(4) : "" };
    });
    const newData = { ...fileData, rows: newRows, headers: [...fileData.headers, compositeName], colCount: fileData.colCount + 1 };
    setResultData(newData);
    addLog(`✅ 已计算构念得分 "${compositeName}" = mean(${compositeCols.join(", ")})`);
  };

  const handleReverse = () => {
    if (!fileData || !reverseCol) return;
    const newRows = fileData.rows.map((row) => {
      const val = row[reverseCol];
      if (typeof val === "number") {
        return { ...row, [`${reverseCol}_rev`]: scaleMax + 1 - val };
      }
      return row;
    });
    const newData = { ...fileData, rows: newRows, headers: [...fileData.headers, `${reverseCol}_rev`], colCount: fileData.colCount + 1 };
    setResultData(newData);
    addLog(`✅ 已反向编码 "${reverseCol}" → "${reverseCol}_rev"（${scaleMax} 分制）`);
  };

  const handleMissing = () => {
    if (!fileData) return;
    const numCols = fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number"));
    let newRows = [...fileData.rows];
    let removed = 0;

    if (missingStrategy === "drop") {
      const before = newRows.length;
      newRows = newRows.filter((row) => fileData.headers.every((h) => row[h] !== null && row[h] !== undefined && row[h] !== ""));
      removed = before - newRows.length;
      addLog(`✅ 删除了 ${removed} 行含缺失值的数据`);
    } else {
      for (const col of numCols) {
        const vals = newRows.map((r) => r[col]).filter((v): v is number => typeof v === "number");
        const fill = missingStrategy === "mean" ? vals.reduce((s, v) => s + v, 0) / vals.length :
          vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)];
        let filled = 0;
        for (const row of newRows) {
          if ((row[col] === null || row[col] === undefined || row[col] === "") && vals.length > 0) {
            row[col] = +fill.toFixed(2);
            filled++;
          }
        }
        if (filled > 0) addLog(`  "${col}": 用${missingStrategy === "mean" ? "均值" : "中位数"}填补了 ${filled} 个缺失值`);
      }
    }
    setResultData({ ...fileData, rows: newRows, rowCount: newRows.length });
  };

  const handleOutliers = () => {
    if (!fileData) return;
    const numCols = fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number"));
    const outlierRows = new Set<number>();
    for (const col of numCols) {
      const vals = fileData.rows.map((r) => r[col]).filter((v): v is number => typeof v === "number").sort((a, b) => a - b);
      const q1 = vals[Math.floor(vals.length * 0.25)];
      const q3 = vals[Math.floor(vals.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      fileData.rows.forEach((row, i) => {
        const v = row[col];
        if (typeof v === "number" && (v < lower || v > upper)) outlierRows.add(i);
      });
    }
    addLog(`✅ 检测到 ${outlierRows.size} 行含异常值（IQR 方法）`);
    const newRows = fileData.rows.filter((_, i) => !outlierRows.has(i));
    setResultData({ ...fileData, rows: newRows, rowCount: newRows.length });
    addLog(`  删除后剩余 ${newRows.length} 行`);
  };

  const handleColumnManage = () => {
    if (!fileData) return;
    const keptHeaders = fileData.headers.filter((h) => !droppedCols.includes(h));
    const nextHeaders = keptHeaders.map((h) => renameMap[h]?.trim() || h);
    const duplicated = nextHeaders.find((h, i) => nextHeaders.indexOf(h) !== i);
    if (duplicated) {
      addLog(`⚠️ 列名 "${duplicated}" 重复，请修改后再应用`);
      return;
    }

    const newRows = fileData.rows.map((row) => {
      const nextRow: Record<string, string | number> = {};
      keptHeaders.forEach((oldName, i) => {
        nextRow[nextHeaders[i]] = row[oldName];
      });
      return nextRow;
    });
    setResultData({ ...fileData, headers: nextHeaders, rows: newRows, colCount: nextHeaders.length });
    addLog(`✅ 已保留 ${nextHeaders.length} 列，删除 ${droppedCols.length} 列，并应用列名映射`);
  };

  const handleDownload = () => {
    const data = resultData || fileData;
    if (!data) return;
    const csv = [data.headers.join(","), ...data.rows.map((r) => data.headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `cleaned-${data.fileName}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center text-xl">🧹</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">数据清洗</h1>
            <p className="text-sm text-[var(--text-muted)]">构念计算 · 反向题 · 缺失值 · 异常值 · 列管理</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">上传数据 → 选择清洗操作 → 预览结果 → 导出</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FileUpload onUpload={handleFileUpload} description="CSV / JSON，问卷原始数据" />

            {/* Action selector */}
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <button key={a.id} onClick={() => setAction(a.id)}
                  className={cn("px-3 py-1.5 rounded-full text-xs border transition-colors flex items-center gap-1.5",
                    action === a.id ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
                  )}>
                  <a.icon className="w-3.5 h-3.5" /> {a.label}
                </button>
              ))}
            </div>

            {/* Action-specific controls */}
            {fileData && (
              <div className="glass-card p-4 space-y-3">
                {action === "composite" && (
                  <>
                    <p className="text-xs text-[var(--text-muted)]">选择要合并的题项列，计算均值作为构念得分</p>
                    <Input value={compositeName} onChange={(e) => setCompositeName(e.target.value)}
                      placeholder="新列名，如 trust_score" className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
                    <div className="flex flex-wrap gap-1.5">
                      {fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number")).map((h) => (
                        <button key={h} onClick={() => setCompositeCols((prev) => prev.includes(h) ? prev.filter((c) => c !== h) : [...prev, h])}
                          className={cn("px-2 py-1 rounded-full text-xs border transition-colors",
                            compositeCols.includes(h) ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-muted)]"
                          )}>{h}</button>
                      ))}
                    </div>
                    <Button onClick={handleComposite} disabled={!compositeName || compositeCols.length < 2}
                      className="w-full h-9 bg-[var(--primary)] text-white">
                      <Calculator className="w-4 h-4 mr-1" /> 计算构念得分（{compositeCols.length} 题项）
                    </Button>
                  </>
                )}

                {action === "reverse" && (
                  <>
                    <p className="text-xs text-[var(--text-muted)]">选择要反向编码的列和量表分制</p>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={reverseCol} onChange={(e) => setReverseCol(e.target.value)}
                        className="h-9 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                        <option value="">选择列...</option>
                        {fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number")).map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <Input type="number" value={scaleMax} onChange={(e) => setScaleMax(Number(e.target.value) || 7)}
                        placeholder="量表最大值" className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
                    </div>
                    <Button onClick={handleReverse} disabled={!reverseCol} className="w-full h-9 bg-[var(--primary)] text-white">
                      <RefreshCw className="w-4 h-4 mr-1" /> 反向编码
                    </Button>
                  </>
                )}

                {action === "missing" && (
                  <>
                    <p className="text-xs text-[var(--text-muted)]">选择缺失值处理策略</p>
                    <div className="flex gap-2">
                      {(["drop", "mean", "median"] as const).map((s) => (
                        <button key={s} onClick={() => setMissingStrategy(s)}
                          className={cn("px-3 py-1.5 rounded-lg text-xs border transition-colors",
                            missingStrategy === s ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
                          )}>
                          {s === "drop" ? "删除含缺失行" : s === "mean" ? "均值插补" : "中位数插补"}
                        </button>
                      ))}
                    </div>
                    <Button onClick={handleMissing} className="w-full h-9 bg-[var(--primary)] text-white">
                      <Wand2 className="w-4 h-4 mr-1" /> 处理缺失值
                    </Button>
                  </>
                )}

                {action === "outliers" && (
                  <>
                    <p className="text-xs text-[var(--text-muted)]">基于 IQR（四分位距）方法检测异常值并移除</p>
                    <Button onClick={handleOutliers} className="w-full h-9 bg-[var(--primary)] text-white">
                      <ArrowDownUp className="w-4 h-4 mr-1" /> 检测并移除异常值
                    </Button>
                  </>
                )}

                {action === "rename" && (
                  <>
                    <p className="text-xs text-[var(--text-muted)]">修改输出列名，点击垃圾桶可删除无关列</p>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {fileData.headers.map((h) => {
                        const dropped = droppedCols.includes(h);
                        return (
                          <div key={h} className="grid grid-cols-[auto_1fr] gap-2 items-center">
                            <button type="button" onClick={() => setDroppedCols((prev) => dropped ? prev.filter((c) => c !== h) : [...prev, h])}
                              className={cn("w-8 h-8 rounded-md border flex items-center justify-center transition-colors",
                                dropped ? "border-[var(--error)]/40 text-[var(--error)] bg-[var(--error)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
                              )}
                              title={dropped ? "恢复此列" : "删除此列"}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 items-center">
                              <span className={cn("text-xs font-mono truncate", dropped ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]")}>{h}</span>
                              <Input value={renameMap[h] ?? h} disabled={dropped}
                                onChange={(e) => setRenameMap((prev) => ({ ...prev, [h]: e.target.value }))}
                                className="h-8 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] text-xs" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button onClick={handleColumnManage} disabled={droppedCols.length >= fileData.headers.length}
                      className="w-full h-9 bg-[var(--primary)] text-white">
                      <RefreshCw className="w-4 h-4 mr-1" /> 应用列名管理
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Processing log */}
            {log.length > 0 && (
              <div className="glass-card p-4">
                <span className="text-xs text-[var(--text-muted)] mb-2 block">处理日志</span>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {log.map((l, i) => <p key={i} className="text-xs text-[var(--text-secondary)] font-mono">{l}</p>)}
                </div>
              </div>
            )}
          </div>

          {/* Output preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">
                {resultData ? `处理后（${resultData.rowCount} 行 × ${resultData.colCount} 列）` : fileData ? "原始数据预览" : "等待上传数据"}
              </span>
              {(resultData || fileData) && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleDownload}>
                  <Download className="w-3 h-3 mr-1" /> 导出 CSV
                </Button>
              )}
            </div>
            <div className="glass-card p-4 overflow-auto max-h-[600px]">
              {(resultData || fileData) ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {(resultData || fileData)!.headers.map((h) => (
                        <th key={h} className="text-left py-2 px-2 text-[var(--text-muted)] font-medium sticky top-0 bg-[var(--bg-secondary)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(resultData || fileData)!.rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-[var(--border)]">
                        {(resultData || fileData)!.headers.map((h) => (
                          <td key={h} className="py-1.5 px-2 text-[var(--text-secondary)] max-w-[150px] truncate">{String(row[h] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-20 text-[var(--text-muted)] text-sm">
                  <p>上传数据后在此预览</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
