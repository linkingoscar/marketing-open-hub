"use client";

import { useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConstructGrouperProps {
  columns: string[];
  groups: Record<string, string[]>;
  onChange: (groups: Record<string, string[]>) => void;
  minGroups?: number;
  maxGroups?: number;
}

export function ConstructGrouper({ columns, groups, onChange, minGroups = 2, maxGroups = 6 }: ConstructGrouperProps) {
  const [newName, setNewName] = useState("");

  const assignedItems = Object.values(groups).flat();
  const unassigned = columns.filter((c) => !assignedItems.includes(c));

  const addGroup = () => {
    const name = newName.trim() || `构念${Object.keys(groups).length + 1}`;
    onChange({ ...groups, [name]: [] });
    setNewName("");
  };

  const removeGroup = (name: string) => {
    const next = { ...groups };
    delete next[name];
    onChange(next);
  };

  const toggleItem = (groupName: string, item: string) => {
    const next = { ...groups };
    // Remove from other groups first
    for (const g of Object.keys(next)) {
      next[g] = next[g].filter((i) => i !== item);
    }
    // Toggle in target group
    if (next[groupName].includes(item)) {
      next[groupName] = next[groupName].filter((i) => i !== item);
    } else {
      next[groupName] = [...next[groupName], item];
    }
    onChange(next);
  };

  const groupColors = ["#6366F1", "#06B6D4", "#F59E0B", "#EC4899", "#10B981", "#EF4444"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-[var(--text-muted)]" />
        <span className="text-xs font-medium text-[var(--text-muted)]">构念分组</span>
        <span className="text-[10px] text-[var(--text-muted)]">（至少 {minGroups} 个构念）</span>
      </div>

      {/* Existing groups */}
      {Object.entries(groups).map(([name, items], idx) => (
        <div key={name} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: groupColors[idx % groupColors.length] }} />
              <span className="text-sm font-medium text-[var(--text-primary)]">{name}</span>
              <span className="text-[10px] text-[var(--text-muted)]">({items.length} 题项)</span>
            </div>
            {Object.keys(groups).length > minGroups && (
              <button onClick={() => removeGroup(name)} className="text-[var(--text-muted)] hover:text-[var(--error)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((col) => {
              const selected = items.includes(col);
              const takenByOther = assignedItems.includes(col) && !selected;
              return (
                <button key={col} disabled={takenByOther}
                  onClick={() => toggleItem(name, col)}
                  className={cn(
                    "px-2 py-1 rounded text-xs border transition-all",
                    selected ? "border-transparent text-white" : takenByOther ? "border-[var(--border)] text-[var(--text-muted)] opacity-30 cursor-not-allowed" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/30"
                  )}
                  style={selected ? { background: groupColors[idx % groupColors.length], borderColor: groupColors[idx % groupColors.length] } : undefined}
                >
                  {col}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add group */}
      {Object.keys(groups).length < maxGroups && (
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGroup()}
            placeholder={`构念${Object.keys(groups).length + 1} 名称`}
            className="flex-1 h-8 px-2 rounded-md bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <button onClick={addGroup}
            className="h-8 px-3 rounded-md text-xs bg-[var(--primary)] text-white hover:opacity-90 flex items-center gap-1">
            <Plus className="w-3 h-3" /> 添加构念
          </button>
        </div>
      )}

      {/* Unassigned hint */}
      {unassigned.length > 0 && (
        <p className="text-[10px] text-[var(--text-muted)]">
          未分组：{unassigned.join(", ")}
        </p>
      )}
    </div>
  );
}
