"use client";

import { useState } from "react";
import { Clock, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/lib/api/history";
import { cn } from "@/lib/utils";

export function HistoryPanel({ tool }: { tool: string }) {
  const { records, removeRecord, clearAll } = useHistoryStore();
  const toolRecords = records.filter((r) => r.tool === tool);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (toolRecords.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          历史记录 ({toolRecords.length})
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--error)]"
          onClick={() => { if (confirm("清空所有历史记录？")) clearAll(); }}>
          <Trash2 className="w-3 h-3 mr-1" /> 清空
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {toolRecords.map((record) => (
            <div key={record.id}
              className={cn("p-3 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors",
                selectedId === record.id && "border-[var(--primary)]/30 bg-[var(--bg-card-hover)]"
              )}
              onClick={() => setSelectedId(selectedId === record.id ? null : record.id)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-[var(--text-muted)]" />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{record.type}</span>
                  {record.fileName && (
                    <span className="text-[10px] text-[var(--text-muted)]">({record.fileName})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(record.timestamp).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); removeRecord(record.id); }}
                    className="text-[var(--text-muted)] hover:text-[var(--error)]">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {selectedId === record.id && (
                <div className="mt-2 pt-2 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-2">
                    输入: {record.input.slice(0, 200)}{record.input.length > 200 ? "..." : ""}
                  </p>
                  <pre className="text-xs text-[var(--text-tertiary)] whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                    {record.result.slice(0, 1000)}{record.result.length > 1000 ? "..." : ""}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
