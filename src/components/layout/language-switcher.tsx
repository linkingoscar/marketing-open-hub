"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "zh" ? "en" : "zh")}
      className={cn(
        "px-2 py-1 rounded-md text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/30 transition-colors",
        className
      )}
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
