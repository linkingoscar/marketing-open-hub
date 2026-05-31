"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Loader2, Plus, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileUpload, type ParsedData } from "@/components/workspace/file-upload";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { useHistoryStore } from "@/lib/api/history";
import { cn } from "@/lib/utils";

interface Node { id: string; label: string; x: number; y: number; type: "iv" | "dv" | "mediator" | "moderator" }
interface Edge { from: string; to: string; label?: string }
interface PathResult { from: string; to: string; coefficient: number; p: number; significant: boolean }

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const s = x < 0 ? -1 : 1; x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  return 0.5 * (1 + s * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)));
}

export default function SEMEditorPage() {
  const [fileData, setFileData] = useState<ParsedData | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [result, setResult] = useState<{ paths: PathResult[]; rSquared: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<Node["type"]>("iv");
  const svgRef = useRef<SVGSVGElement>(null);
  const { addRecord } = useHistoryStore();

  const addNode = () => {
    if (!newLabel.trim()) return;
    const id = `node_${Date.now()}`;
    setNodes((prev) => [...prev, { id, label: newLabel.trim(), x: 200 + Math.random() * 400, y: 150 + Math.random() * 200, type: newType }]);
    setNewLabel("");
  };

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
  };

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    setDragging(id);
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setNodes((prev) => prev.map((n) => n.id === dragging ? { ...n, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } : n));
  }, [dragging, dragOffset]);

  const handleMouseUp = () => { setDragging(null); };

  const handleNodeClick = (id: string) => {
    if (connecting) {
      if (connecting !== id) {
        setEdges((prev) => [...prev, { from: connecting, to: id }]);
      }
      setConnecting(null);
    }
  };

  const removeEdge = (from: string, to: string) => {
    setEdges((prev) => prev.filter((e) => !(e.from === from && e.to === to)));
  };

  const handleRun = async () => {
    if (!fileData || nodes.length < 2 || edges.length < 1) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const numCols = fileData.headers.filter((h) => fileData.rows.some((r) => typeof r[h] === "number"));
      const data = fileData.rows.map((r) => {
        const row: Record<string, number> = {};
        for (const h of numCols) { const v = r[h]; row[h] = typeof v === "number" ? v : 0; }
        return row;
      });

      // Simple regression for each edge
      const paths: PathResult[] = [];
      const rSquared: Record<string, number> = {};

      for (const edge of edges) {
        const fromNode = nodes.find((n) => n.id === edge.from);
        const toNode = nodes.find((n) => n.id === edge.to);
        if (!fromNode || !toNode) continue;

        // Find matching columns
        const xCol = numCols.find((c) => c.toLowerCase().includes(fromNode.label.toLowerCase().slice(0, 4)));
        const yCol = numCols.find((c) => c.toLowerCase().includes(toNode.label.toLowerCase().slice(0, 4)));
        if (!xCol || !yCol) continue;

        const xVals = data.map((r) => r[xCol]);
        const yVals = data.map((r) => r[yCol]);
        const n = xVals.length;
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

        paths.push({ from: fromNode.label, to: toNode.label, coefficient: +beta.toFixed(4), p: +p.toFixed(6), significant: p < 0.05 });
        if (!rSquared[toNode.label] || r2 > rSquared[toNode.label]) rSquared[toNode.label] = +r2.toFixed(4);
      }

      setResult({ paths, rSquared });
      addRecord({ tool: "sem-editor", type: "SEM 路径分析", input: `${nodes.length} nodes, ${edges.length} edges`, result: JSON.stringify({ paths: paths.length, sig: paths.filter((p) => p.significant).length }) });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-xl">🔗</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">SEM 路径编辑器</h1>
            <p className="text-sm text-[var(--text-muted)]">拖拽绘制路径图 → 自动计算路径系数和拟合指标</p>
          </div>
        </div>
        <ActiveProviderBadge className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="space-y-4">
            <FileUpload onUpload={setFileData} description="CSV 数据文件" />

            {/* Add node */}
            <div className="glass-card p-4 space-y-3">
              <span className="text-xs text-[var(--text-muted)] block">添加变量节点</span>
              <div className="flex gap-2">
                <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="变量名" className="h-8 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]" />
                <select value={newType} onChange={(e) => setNewType(e.target.value as Node["type"])}
                  className="h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                  <option value="iv">自变量</option>
                  <option value="dv">因变量</option>
                  <option value="mediator">中介</option>
                  <option value="moderator">调节</option>
                </select>
                <Button size="sm" onClick={addNode} className="h-8 bg-[var(--primary)] text-white"><Plus className="w-3 h-3" /></Button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">提示：点击两个节点可添加路径连线</p>
            </div>

            {/* Edges list */}
            {edges.length > 0 && (
              <div className="glass-card p-4">
                <span className="text-xs text-[var(--text-muted)] mb-2 block">路径 ({edges.length})</span>
                <div className="space-y-1">
                  {edges.map((e, i) => {
                    const from = nodes.find((n) => n.id === e.from);
                    const to = nodes.find((n) => n.id === e.to);
                    const pathResult = result?.paths.find((p) => p.from === from?.label && p.to === to?.label);
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--primary)]">{from?.label}</span>
                        <span className="text-[var(--text-muted)]">→</span>
                        <span className="text-[var(--accent)]">{to?.label}</span>
                        {pathResult && (
                          <span className={cn("font-mono", pathResult.significant ? "text-[var(--success)]" : "text-[var(--error)]")}>
                            β={pathResult.coefficient.toFixed(3)} {pathResult.significant ? "✓" : "✗"}
                          </span>
                        )}
                        <button onClick={() => removeEdge(e.from, e.to)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--error)]"><X className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleRun} disabled={loading || !fileData || nodes.length < 2 || edges.length < 1}
                className="flex-1 h-10 bg-[var(--primary)] text-white">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 计算中...</> : <><Play className="w-4 h-4 mr-2" /> 运行 SEM</>}
              </Button>
              <Button variant="outline" onClick={() => { setNodes([]); setEdges([]); setResult(null); }}
                className="h-10 border-[var(--border)]"><RotateCcw className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Right: SVG Canvas + Results */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-4 min-h-[400px] relative overflow-hidden"
              onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <svg ref={svgRef} className="w-full h-[400px]">
                {/* Edges */}
                {edges.map((edge, i) => {
                  const from = nodes.find((n) => n.id === edge.from);
                  const to = nodes.find((n) => n.id === edge.to);
                  if (!from || !to) return null;
                  const pathResult = result?.paths.find((p) => p.from === from.label && p.to === to.label);
                  const color = pathResult ? (pathResult.significant ? "#10B981" : "#EF4444") : "#64748B";
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2 - 30;
                  return (
                    <g key={i}>
                      <path d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                        fill="none" stroke={color} strokeWidth={pathResult ? 2.5 : 1.5}
                        markerEnd="url(#arrow)" strokeDasharray={pathResult ? "none" : "6 4"} />
                      {pathResult && (
                        <text x={midX} y={midY - 8} textAnchor="middle" className="text-[11px] font-mono font-bold fill-current" style={{ color }}>
                          β={pathResult.coefficient.toFixed(3)} {pathResult.significant ? "✓" : "✗"}
                        </text>
                      )}
                    </g>
                  );
                })}

                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
                  </marker>
                </defs>

                {/* Nodes */}
                {nodes.map((node) => {
                  const colors = { iv: "#6366F1", dv: "#06B6D4", mediator: "#F59E0B", moderator: "#EC4899" };
                  const color = colors[node.type];
                  return (
                    <g key={node.id} onMouseDown={(e) => handleMouseDown(node.id, e)} onClick={() => handleNodeClick(node.id)}
                      className="cursor-grab active:cursor-grabbing">
                      <circle cx={node.x} cy={node.y} r={32} fill={`${color}15`} stroke={color} strokeWidth={2} />
                      <text x={node.x} y={node.y - 4} textAnchor="middle" className="text-xs font-medium fill-current" style={{ color: "#F1F5F9" }}>
                        {node.label.length > 8 ? node.label.slice(0, 7) + "…" : node.label}
                      </text>
                      <text x={node.x} y={node.y + 14} textAnchor="middle" className="text-[9px] fill-current" style={{ color: "#94A3B8" }}>
                        {node.type === "iv" ? "自变量" : node.type === "dv" ? "因变量" : node.type === "mediator" ? "中介" : "调节"}
                      </text>
                      <circle cx={node.x + 24} cy={node.y - 24} r={6} fill="#EF4444" className="opacity-0 hover:opacity-100 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} />
                    </g>
                  );
                })}
              </svg>

              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[var(--text-muted)] text-sm">在左侧面板添加变量节点，然后拖拽排列、点击连线</p>
                </div>
              )}
            </div>

            {/* Results */}
            {result && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">路径分析结果</h3>
                <div className="space-y-2">
                  {result.paths.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-card)]">
                      <span className="text-sm text-[var(--primary)]">{p.from}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.abs(p.coefficient) * 100)}%`, background: p.significant ? "var(--success)" : "var(--error)" }} />
                      </div>
                      <span className="text-sm text-[var(--accent)]">{p.to}</span>
                      <span className="text-sm font-mono font-bold" style={{ color: p.significant ? "var(--success)" : "var(--error)" }}>
                        β={p.coefficient.toFixed(3)}
                      </span>
                      <Badge variant="outline" className={cn("text-[10px]", p.significant ? "border-[var(--success)]/30 text-[var(--success)]" : "border-[var(--error)]/30 text-[var(--error)]")}>
                        p={p.p < 0.001 ? "<.001" : p.p.toFixed(3)} {p.significant ? "✓" : "✗"}
                      </Badge>
                    </div>
                  ))}
                </div>

                {Object.keys(result.rSquared).length > 0 && (
                  <div className="mt-4">
                    <span className="text-xs text-[var(--text-muted)] mb-2 block">R² 解释方差</span>
                    {Object.entries(result.rSquared).map(([name, r2]) => (
                      <div key={name} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[var(--text-secondary)] w-16">{name}</span>
                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${r2 * 100}%` }} />
                        </div>
                        <span className="text-xs font-mono text-[var(--text-primary)] w-12 text-right">{(r2 * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <div className="text-sm text-[var(--error)] glass-card p-4">{error}</div>}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
