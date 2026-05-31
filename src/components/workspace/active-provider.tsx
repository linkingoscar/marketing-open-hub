"use client";

import { useAPIStore, API_PROVIDERS } from "@/lib/api/config";
import { cn } from "@/lib/utils";

export function ActiveProviderBadge({ className }: { className?: string }) {
  const { preferredProvider, setPreferredProvider } = useAPIStore();
  const activeConfig = useAPIStore.getState().getActiveConfig();
  const allConfigs = useAPIStore.getState().getAllConfigs();

  if (allConfigs.length === 0) return null;

  const activeProvider = API_PROVIDERS.find((p) => p.id === (activeConfig?.provider ?? ""));
  const activeName = activeProvider?.name ?? "未知";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-xs">
        <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
        <span className="text-[var(--text-secondary)]">{activeName}</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span className="font-mono text-[var(--text-muted)]">{activeConfig?.model}</span>
      </div>

      {allConfigs.length > 1 && (
        <select
          value={preferredProvider ?? ""}
          onChange={(e) => setPreferredProvider(e.target.value || null)}
          className="h-7 px-2 rounded-full text-xs bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)]"
        >
          <option value="">自动选择</option>
          {allConfigs.map((c) => {
            const p = API_PROVIDERS.find((pp) => pp.id === c.provider);
            return (
              <option key={c.provider} value={c.provider}>
                {p?.name ?? c.provider} · {c.model}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}
