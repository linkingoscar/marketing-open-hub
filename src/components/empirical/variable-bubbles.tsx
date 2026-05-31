"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Merge } from "lucide-react";
import type { Construct, VariableItem } from "@/lib/empirical/construct-detector";
import { cn } from "@/lib/utils";

interface VariableBubblesProps {
  constructs: Construct[];
  ungrouped: VariableItem[];
  demographics: VariableItem[];
  onRemoveItem: (constructId: string, itemName: string) => void;
  onMergeItems: (itemNames: string[], newConstructName: string) => void;
  onRemoveConstruct: (constructId: string) => void;
  selectedConstructs: string[];
  onSelectConstruct: (id: string) => void;
}

export function VariableBubbles({
  constructs, ungrouped, demographics,
  onRemoveItem, onMergeItems, onRemoveConstruct: _onRemoveConstruct,
  selectedConstructs, onSelectConstruct,
}: VariableBubblesProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemName: string; constructId?: string } | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState<string[]>([]);
  const [mergeName, setMergeName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent, itemName: string, constructId?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemName, constructId });
  };

  const handleMerge = () => {
    if (mergeSelection.length >= 2 && mergeName.trim()) {
      onMergeItems(mergeSelection, mergeName.trim());
      setMergeMode(false);
      setMergeSelection([]);
      setMergeName("");
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-6" onClick={() => setContextMenu(null)}>
      {/* Merge mode toggle */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => { setMergeMode(!mergeMode); setMergeSelection([]); }}
          className={cn("px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5",
            mergeMode ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}>
          <Merge className="w-3.5 h-3.5" /> {mergeMode ? "退出合并模式" : "合并变量"}
        </button>
        {mergeMode && mergeSelection.length >= 2 && (
          <div className="flex items-center gap-2">
            <input value={mergeName} onChange={(e) => setMergeName(e.target.value)}
              placeholder="新构念名称" className="h-7 px-2 rounded text-xs bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]" />
            <button onClick={handleMerge} className="h-7 px-3 rounded text-xs bg-[var(--primary)] text-white">合并 ({mergeSelection.length})</button>
          </div>
        )}
      </div>

      {/* Constructs as large bubbles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {constructs.map((construct) => {
          const isSelected = selectedConstructs.includes(construct.id);
          return (
            <motion.div key={construct.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "relative rounded-2xl p-5 cursor-pointer transition-all duration-300",
                "backdrop-blur-xl border",
                isSelected
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_20px_var(--glow-primary)]"
                  : "border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)]"
              )}
              style={{ borderColor: isSelected ? construct.color : undefined }}
              onClick={() => onSelectConstruct(construct.id)}
              onContextMenu={(e) => handleContextMenu(e, construct.id, construct.id)}
            >
              {/* Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: construct.color }} />

              {/* Header */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ background: construct.color }} />
                  <span className="font-semibold text-sm text-[var(--text-primary)]">{construct.displayName}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{construct.items.length} 题项</span>
              </div>

              {/* Item bubbles inside construct */}
              <div className="flex flex-wrap gap-2 relative z-10">
                {construct.items.map((item, idx) => (
                  <motion.div key={item.name}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "group/item relative px-2.5 py-1 rounded-full text-xs border transition-all",
                      mergeMode
                        ? mergeSelection.includes(item.name)
                          ? "border-[var(--primary)] bg-[var(--primary)]/20 text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/30 cursor-pointer"
                        : "border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)]"
                    )}
                    style={mergeMode ? undefined : { borderColor: `${construct.color}30` }}
                    onClick={(e) => {
                      if (mergeMode) {
                        e.stopPropagation();
                        setMergeSelection((prev) => prev.includes(item.name) ? prev.filter((n) => n !== item.name) : [...prev, item.name]);
                      }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, item.name, construct.id)}
                  >
                    <span>{item.name}</span>
                    <span className="ml-1 text-[9px] text-[var(--text-muted)]">M={item.mean}</span>
                    {!mergeMode && (
                      <button onClick={(e) => { e.stopPropagation(); onRemoveItem(construct.id, item.name); }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--error)] text-white text-[8px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
                {!mergeMode && (
                  <button className="w-7 h-7 rounded-full border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Mean score bar */}
              <div className="mt-3 relative z-10">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                  <span>构念均值</span>
                  <span>{(construct.meanScore.reduce((s, v) => s + v, 0) / construct.meanScore.length).toFixed(2)}</span>
                </div>
                <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${(construct.meanScore.reduce((s, v) => s + v, 0) / construct.meanScore.length / 7) * 100}%`,
                    background: construct.color,
                  }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Ungrouped variables */}
      {ungrouped.length > 0 && (
        <div>
          <span className="text-xs text-[var(--text-muted)] mb-2 block">未分组变量 ({ungrouped.length})</span>
          <div className="flex flex-wrap gap-2">
            {ungrouped.map((item, idx) => (
              <motion.div key={item.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all cursor-pointer",
                  mergeMode && mergeSelection.includes(item.name)
                    ? "border-[var(--primary)] bg-[var(--primary)]/20 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/30"
                )}
                onClick={() => mergeMode && setMergeSelection((prev) => prev.includes(item.name) ? prev.filter((n) => n !== item.name) : [...prev, item.name])}
                onContextMenu={(e) => handleContextMenu(e, item.name)}
              >
                {item.name}
                <span className="ml-1 text-[9px] text-[var(--text-muted)]">
                  {item.type === "ordinal" ? "📋" : item.type === "continuous" ? "📊" : "🏷️"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Demographics */}
      {demographics.length > 0 && (
        <div>
          <span className="text-xs text-[var(--text-muted)] mb-2 block">人口统计学变量 ({demographics.length})</span>
          <div className="flex flex-wrap gap-2">
            {demographics.map((item) => (
              <span key={item.name} className="px-2.5 py-1 rounded-full text-xs border border-[var(--border)] text-[var(--text-muted)]">
                {item.name} <span className="text-[9px]">M={item.mean}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.constructId && (
              <button className="w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] text-left flex items-center gap-2"
                onClick={() => { onRemoveItem(contextMenu.constructId!, contextMenu.itemName); setContextMenu(null); }}>
                <X className="w-3 h-3" /> 移除此题项
              </button>
            )}
            <button className="w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] text-left flex items-center gap-2"
              onClick={() => { setMergeMode(true); setMergeSelection([contextMenu.itemName]); setContextMenu(null); }}>
              <Merge className="w-3 h-3" /> 合并到新构念
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
