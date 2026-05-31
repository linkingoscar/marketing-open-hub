"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, Zap } from "lucide-react";
import type { Construct } from "@/lib/empirical/construct-detector";
import type { ProcessTemplate, FrameworkSlot } from "@/lib/empirical/process-templates";
import { cn } from "@/lib/utils";

interface PathResult {
  from: string;
  to: string;
  coefficient: number;
  p: number;
  significant: boolean;
}

interface FrameworkCanvasProps {
  template: ProcessTemplate;
  constructs: Construct[];
  onRunAnalysis: (assignments: Record<string, string>) => void;
  results: PathResult[] | null;
  loading: boolean;
}

// Node positions for the framework diagram
function getSlotPositions(slots: FrameworkSlot[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const _centerX = 400, centerY = 200;
  const iv = slots.filter((s) => s.role === "iv");
  const dv = slots.filter((s) => s.role === "dv");
  const mediators = slots.filter((s) => s.role === "mediator");
  const moderators = slots.filter((s) => s.role === "moderator");

  // IV on the left
  iv.forEach((s, i) => { positions[s.id] = { x: 80, y: centerY + (i - (iv.length - 1) / 2) * 100 }; });
  // DV on the right
  dv.forEach((s, i) => { positions[s.id] = { x: 720, y: centerY + (i - (dv.length - 1) / 2) * 100 }; });
  // Mediators in the center
  mediators.forEach((s, i) => { positions[s.id] = { x: 400, y: centerY + (i - (mediators.length - 1) / 2) * 100 }; });
  // Moderators above/below
  moderators.forEach((s, i) => { positions[s.id] = { x: 400, y: centerY - 140 + i * 280 }; });

  return positions;
}

export function FrameworkCanvas({ template, constructs, onRunAnalysis, results, loading }: FrameworkCanvasProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [draggingConstruct, setDraggingConstruct] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const positions = getSlotPositions(template.slots);

  const handleDrop = (slotId: string) => {
    if (draggingConstruct) {
      setAssignments((prev) => ({ ...prev, [slotId]: draggingConstruct }));
      setDraggingConstruct(null);
      setHoveredSlot(null);
    }
  };

  const handleRemoveAssignment = (slotId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const allAssigned = template.slots.filter((s) => s.required).every((s) => assignments[s.id]);
  const assignedConstructs = Object.values(assignments);
  const availableConstructs = constructs.filter((c) => !assignedConstructs.includes(c.id));

  const getResultForPath = (from: string, to: string): PathResult | undefined => {
    if (!results) return undefined;
    return results.find((r) => r.from === from && r.to === to);
  };

  return (
    <div className="space-y-4">
      {/* Available constructs to drag */}
      <div className="glass-card p-4">
        <span className="text-xs text-[var(--text-muted)] mb-2 block">可用构念 — 拖拽到框架槽位</span>
        <div className="flex flex-wrap gap-2">
          {availableConstructs.map((c) => (
            <div key={c.id}
              draggable
              onDragStart={() => setDraggingConstruct(c.id)}
              onDragEnd={() => setDraggingConstruct(null)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border cursor-grab active:cursor-grabbing transition-all",
                draggingConstruct === c.id ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-105" : "border-[var(--border)] hover:border-[var(--primary)]/30"
              )}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-[var(--text-primary)]">{c.displayName}</span>
              <span className="text-[10px] text-[var(--text-muted)]">({c.items.length})</span>
            </div>
          ))}
          {availableConstructs.length === 0 && (
            <span className="text-xs text-[var(--text-muted)]">所有构念已分配</span>
          )}
        </div>
      </div>

      {/* Framework SVG Canvas */}
      <div className="glass-card p-6 overflow-x-auto">
        <svg ref={svgRef} viewBox="0 0 800 400" className="w-full max-w-[800px] mx-auto" style={{ minHeight: 300 }}>
          <defs>
            <filter id="glass">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
            </marker>
            <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#10B981" />
            </marker>
            <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
            </marker>
          </defs>

          {/* Paths (arrows between slots) */}
          {template.paths.map((path, idx) => {
            const fromPos = positions[path.from];
            const toPos = positions[path.to];
            if (!fromPos || !toPos) return null;
            const result = getResultForPath(path.from, path.to);
            const color = result ? (result.significant ? "#10B981" : "#EF4444") : "#94A3B8";
            const markerEnd = result ? (result.significant ? "url(#arrowhead-green)" : "url(#arrowhead-red)") : "url(#arrowhead)";
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2 - 30;

            return (
              <g key={idx}>
                {/* Path line */}
                <path
                  d={`M ${fromPos.x + 60} ${fromPos.y} Q ${midX} ${midY} ${toPos.x - 60} ${toPos.y}`}
                  fill="none" stroke={color} strokeWidth={result ? 2.5 : 1.5}
                  markerEnd={markerEnd}
                  className="transition-all duration-500"
                  strokeDasharray={result ? "none" : "6 4"}
                />
                {/* Animated beam when loading */}
                {loading && (
                  <circle r="4" fill={color} opacity="0.8">
                    <animateMotion dur="1.5s" repeatCount="indefinite"
                      path={`M ${fromPos.x + 60} ${fromPos.y} Q ${midX} ${midY} ${toPos.x - 60} ${toPos.y}`} />
                  </circle>
                )}
                {/* Path label */}
                <text x={midX} y={midY - 8} textAnchor="middle" className="text-[10px] fill-[var(--text-muted)]">
                  {path.label}
                </text>
                {/* Result coefficient */}
                {result && (
                  <text x={midX} y={midY + 14} textAnchor="middle"
                    className="text-[11px] font-mono font-bold"
                    fill={result.significant ? "#10B981" : "#EF4444"}>
                    β={result.coefficient.toFixed(3)} {result.significant ? "✓" : "✗"}
                  </text>
                )}
              </g>
            );
          })}

          {/* Slot nodes */}
          {template.slots.map((slot) => {
            const pos = positions[slot.id];
            if (!pos) return null;
            const assignedId = assignments[slot.id];
            const assignedConstruct = assignedId ? constructs.find((c) => c.id === assignedId) : null;
            const isHovered = hoveredSlot === slot.id;
            const roleColor = slot.role === "iv" ? "#6366F1" : slot.role === "dv" ? "#06B6D4" : slot.role === "mediator" ? "#F59E0B" : "#EC4899";

            return (
              <g key={slot.id}
                onDragOver={(e) => { e.preventDefault(); setHoveredSlot(slot.id); }}
                onDragLeave={() => setHoveredSlot(null)}
                onDrop={(e) => { e.preventDefault(); handleDrop(slot.id); }}
                onClick={() => {
                  if (!assignedConstruct && availableConstructs.length > 0) {
                    setAssignments((prev) => ({ ...prev, [slot.id]: availableConstructs[0].id }));
                  }
                }}
              >
                {/* Glow */}
                {isHovered && (
                  <circle cx={pos.x} cy={pos.y} r="45" fill={roleColor} opacity="0.1" />
                )}
                {/* Outer ring */}
                <circle cx={pos.x} cy={pos.y} r="38"
                  fill={assignedConstruct ? `${assignedConstruct.color}15` : "rgba(255,255,255,0.03)"}
                  stroke={isHovered ? roleColor : assignedConstruct ? assignedConstruct.color : "rgba(148,163,184,0.3)"}
                  strokeWidth={assignedConstruct ? 2.5 : 1.5}
                  className="transition-all duration-300 cursor-pointer"
                />
                {/* Inner circle */}
                <circle cx={pos.x} cy={pos.y} r="28"
                  fill={assignedConstruct ? `${assignedConstruct.color}20` : "rgba(255,255,255,0.02)"}
                  stroke="none"
                />
                {/* Content */}
                {assignedConstruct ? (
                  <>
                    <text x={pos.x} y={pos.y - 4} textAnchor="middle" className="text-[11px] font-semibold" fill="#F1F5F9">
                      {assignedConstruct.displayName.length > 8 ? assignedConstruct.displayName.slice(0, 7) + "…" : assignedConstruct.displayName}
                    </text>
                    <text x={pos.x} y={pos.y + 12} textAnchor="middle" className="text-[9px]" fill="#94A3B8">
                      {assignedConstruct.items.length} items
                    </text>
                    {/* Remove button */}
                    <g className="cursor-pointer opacity-0 hover:opacity-100" onClick={() => handleRemoveAssignment(slot.id)}>
                      <circle cx={pos.x + 30} cy={pos.y - 30} r="8" fill="#EF4444" />
                      <text x={pos.x + 30} y={pos.y - 26} textAnchor="middle" className="text-[10px] font-bold" fill="white">×</text>
                    </g>
                  </>
                ) : (
                  <>
                    <text x={pos.x} y={pos.y - 2} textAnchor="middle" className="text-[10px]" fill="#64748B">
                      {slot.label}
                    </text>
                    <text x={pos.x} y={pos.y + 14} textAnchor="middle" className="text-[9px]" fill="#475569">
                      拖入构念
                    </text>
                  </>
                )}
                {/* Role label */}
                <text x={pos.x} y={pos.y + 52} textAnchor="middle" className="text-[9px]" fill={roleColor}>
                  {slot.role === "iv" ? "自变量" : slot.role === "dv" ? "因变量" : slot.role === "mediator" ? "中介变量" : slot.role === "moderator" ? "调节变量" : "协变量"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Run button */}
      <div className="flex items-center gap-3">
        <button onClick={() => onRunAnalysis(assignments)}
          disabled={!allAssigned || loading}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all",
            allAssigned && !loading
              ? "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white hover:opacity-90 shadow-lg"
              : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
          )}>
          {loading ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap className="w-4 h-4" /></motion.div> 分析中...</>
          ) : (
            <><Play className="w-4 h-4" /> 运行分析</>
          )}
        </button>
        <button onClick={() => { setAssignments({}); }}
          className="px-4 py-2.5 rounded-xl text-sm border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <RotateCcw className="w-4 h-4" />
        </button>
        {!allAssigned && (
          <span className="text-xs text-[var(--text-muted)]">
            请为所有{template.slots.filter((s) => s.required).length}个槽位分配构念
          </span>
        )}
      </div>
    </div>
  );
}
