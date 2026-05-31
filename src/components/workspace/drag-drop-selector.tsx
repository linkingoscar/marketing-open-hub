"use client";

import { useState, useCallback } from "react";
import { GripVertical, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Variable {
  name: string;
  type: "numeric" | "categorical" | "mixed" | "empty";
  n: number;
  sample: string;
}

interface DragDropSelectorProps {
  variables: Variable[];
  selectedA: string;
  selectedB: string;
  selectedGroup: string;
  onChangeA: (v: string) => void;
  onChangeB: (v: string) => void;
  onChangeGroup: (v: string) => void;
  labelA?: string;
  labelB?: string;
  labelGroup?: string;
}

export function DragDropSelector({
  variables, selectedA, selectedB, selectedGroup,
  onChangeA, onChangeB, onChangeGroup,
  labelA = "变量 A (X)", labelB = "变量 B (Y)", labelGroup = "分组变量 (M/W)",
}: DragDropSelectorProps) {
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handleDragStart = (name: string) => setDragItem(name);
  const handleDragEnd = () => setDragItem(null);

  const handleDrop = useCallback((target: "A" | "B" | "group") => {
    if (!dragItem) return;
    if (target === "A") onChangeA(dragItem);
    else if (target === "B") onChangeB(dragItem);
    else onChangeGroup(dragItem);
    setDragItem(null);
  }, [dragItem, onChangeA, onChangeB, onChangeGroup]);

  const numericVars = variables.filter((v) => v.type === "numeric");
  const catVars = variables.filter((v) => v.type === "categorical");

  const typeColor = (type: string) =>
    type === "numeric" ? "#3B82F6" :
    type === "categorical" ? "#F59E0B" :
    type === "mixed" ? "#EC4899" : "#64748B";

  return (
    <div className="space-y-3">
      {/* Drop zones */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { key: "A" as const, label: labelA, value: selectedA, color: "#6366F1" },
          { key: "B" as const, label: labelB, value: selectedB, color: "#06B6D4" },
          { key: "group" as const, label: labelGroup, value: selectedGroup, color: "#F59E0B" },
        ]).map((zone) => (
          <div
            key={zone.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleDrop(zone.key); }}
            className={cn(
              "relative p-3 rounded-lg border-2 border-dashed transition-all min-h-[64px]",
              dragItem ? "border-[var(--primary)]/40 bg-[var(--primary)]/5" : "border-[var(--border)]",
              zone.value && "border-solid bg-[var(--bg-card)]"
            )}
          >
            <div className="text-[10px] text-[var(--text-muted)] mb-1" style={{ color: zone.color }}>{zone.label}</div>
            {zone.value ? (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">{zone.value}</span>
                <button onClick={() => { if (zone.key === "A") onChangeA(""); else if (zone.key === "B") onChangeB(""); else onChangeGroup(""); }}
                  className="ml-auto text-[var(--text-muted)] hover:text-[var(--error)]">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">拖拽变量到此处</span>
            )}
          </div>
        ))}
      </div>

      {/* Variable list */}
      <div>
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-2">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          可用变量 ({variables.length})
        </button>

        {expanded && (
          <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
            {/* Numeric variables */}
            {numericVars.length > 0 && (
              <div>
                <span className="text-[10px] text-[#3B82F6] mb-1 block">连续变量 ({numericVars.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {numericVars.map((v) => (
                    <div
                      key={v.name}
                      draggable
                      onDragStart={() => handleDragStart(v.name)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (!selectedA) onChangeA(v.name);
                        else if (!selectedB) onChangeB(v.name);
                        else if (!selectedGroup) onChangeGroup(v.name);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-grab active:cursor-grabbing border transition-all",
                        dragItem === v.name ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-105" :
                        "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card)]"
                      )}
                      title={`${v.name} (n=${v.n}): ${v.sample}`}
                    >
                      <GripVertical className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-[var(--text-primary)]">{v.name}</span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: typeColor(v.type) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorical variables */}
            {catVars.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] text-[#F59E0B] mb-1 block">分类变量 ({catVars.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {catVars.map((v) => (
                    <div
                      key={v.name}
                      draggable
                      onDragStart={() => handleDragStart(v.name)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (!selectedGroup) onChangeGroup(v.name);
                        else if (!selectedA) onChangeA(v.name);
                        else if (!selectedB) onChangeB(v.name);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-grab active:cursor-grabbing border transition-all",
                        dragItem === v.name ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-105" :
                        "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card)]"
                      )}
                      title={`${v.name} (n=${v.n}): ${v.sample}`}
                    >
                      <GripVertical className="w-3 h-3 text-[var(--text-muted)]" />
                      <span className="text-[var(--text-primary)]">{v.name}</span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: typeColor(v.type) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
