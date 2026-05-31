"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, TrendingDown, Minus, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { searchPapers, type SemanticScholarPaper } from "@/lib/api/semantic-scholar";

interface EvidenceResult {
  paper: SemanticScholarPaper;
  stance: "support" | "mixed" | "against";
  confidence: number;
  keyFinding: string;
}

/**
 * 证据方向仪表盘（Consensus Meter）
 * 用户输入研究假设 → 搜索文献 → 分析证据方向 → 可视化展示
 */
export function ConsensusMeter() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EvidenceResult[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const searchResult = await searchPapers(query, 20);
      
      if (searchResult.papers.length === 0) {
        setError("未找到相关文献。请尝试其他关键词。");
        return;
      }

      // Analyze stance based on abstract keywords (simplified heuristic)
      const analyzed: EvidenceResult[] = searchResult.papers
        .filter((p) => p.abstract)
        .map((paper) => {
          const abstract = paper.abstract?.toLowerCase() ?? "";
          
          // Support indicators
          const supportWords = ["significant", "positive", "confirmed", "supported", "validated", "found that", "demonstrated", "revealed", "showed that", "evidence suggests", "results indicate"];
          // Against indicators
          const againstWords = ["no significant", "not significant", "failed to", "did not", "no effect", "no relationship", "contradicted", "inconsistent", "negative finding"];
          // Mixed indicators
          const mixedWords = ["mixed", "partially", "moderate", "conditional", "depends on", "varied", "inconsistent results"];

          const supportCount = supportWords.filter((w) => abstract.includes(w)).length;
          const againstCount = againstWords.filter((w) => abstract.includes(w)).length;
          const mixedCount = mixedWords.filter((w) => abstract.includes(w)).length;

          let stance: "support" | "mixed" | "against";
          let confidence: number;

          if (supportCount > againstCount && supportCount > mixedCount) {
            stance = "support";
            confidence = Math.min(0.95, 0.5 + supportCount * 0.1);
          } else if (againstCount > supportCount && againstCount > mixedCount) {
            stance = "against";
            confidence = Math.min(0.95, 0.5 + againstCount * 0.1);
          } else {
            stance = "mixed";
            confidence = Math.min(0.9, 0.4 + mixedCount * 0.1);
          }

          // Extract key finding (first sentence of abstract)
          const firstSentence = paper.abstract?.split(".")[0] ?? "";

          return { paper, stance, confidence, keyFinding: firstSentence };
        });

      setResults(analyzed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "搜索失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const supportCount = results.filter((r) => r.stance === "support").length;
  const mixedCount = results.filter((r) => r.stance === "mixed").length;
  const againstCount = results.filter((r) => r.stance === "against").length;
  const total = results.length;

  const supportPct = total > 0 ? (supportCount / total) * 100 : 0;
  const mixedPct = total > 0 ? (mixedCount / total) * 100 : 0;
  const againstPct = total > 0 ? (againstCount / total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="输入研究假设（如：社交媒体广告是否提升品牌认知度）"
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 h-12 rounded-xl bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          搜索
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Consensus Meter visualization */}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">证据方向分析</h2>
            <p className="text-sm text-[var(--text-muted)]">基于 {total} 篇相关文献的自动分析</p>
          </div>

          {/* Meter bar */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-[var(--text-primary)]">证据方向</span>
            </div>
            
            {/* Main bar */}
            <div className="h-12 rounded-lg overflow-hidden flex">
              {supportPct > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${supportPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-emerald-500 flex items-center justify-center"
                >
                  {supportPct > 15 && <span className="text-xs font-bold text-white">{supportPct.toFixed(0)}%</span>}
                </motion.div>
              )}
              {mixedPct > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mixedPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="bg-amber-500 flex items-center justify-center"
                >
                  {mixedPct > 15 && <span className="text-xs font-bold text-white">{mixedPct.toFixed(0)}%</span>}
                </motion.div>
              )}
              {againstPct > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${againstPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                  className="bg-red-500 flex items-center justify-center"
                >
                  {againstPct > 15 && <span className="text-xs font-bold text-white">{againstPct.toFixed(0)}%</span>}
                </motion.div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-[var(--text-secondary)]">支持 <span className="font-bold text-emerald-500">{supportCount}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-[var(--text-secondary)]">混合 <span className="font-bold text-amber-500">{mixedCount}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-[var(--text-secondary)]">反对 <span className="font-bold text-red-500">{againstCount}</span></span>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 rounded-lg bg-[var(--bg-card-hover)]">
              <p className="text-sm text-[var(--text-secondary)]">
                {supportPct > 60
                  ? `✅ 多数文献（${supportPct.toFixed(0)}%）支持该假设。研究方向有较好的文献基础。`
                  : againstPct > 60
                  ? `❌ 多数文献（${againstPct.toFixed(0)}%）不支持该假设。需要重新审视研究方向。`
                  : `⚠️ 文献证据方向不一致。可能存在调节变量或边界条件，值得深入探索。`}
              </p>
            </div>
          </div>

          {/* Paper list grouped by stance */}
          <div className="space-y-4">
            {(["support", "mixed", "against"] as const).map((stance) => {
              const papers = results.filter((r) => r.stance === stance);
              if (papers.length === 0) return null;

              const stanceConfig = {
                support: { label: "支持证据", color: "emerald", icon: TrendingUp },
                mixed: { label: "混合证据", color: "amber", icon: Minus },
                against: { label: "反对证据", color: "red", icon: TrendingDown },
              };

              const config = stanceConfig[stance];
              const Icon = config.icon;

              return (
                <div key={stance}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 text-${config.color}-500`} />
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{config.label}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs bg-${config.color}-500/10 text-${config.color}-500`}>{papers.length} 篇</span>
                  </div>
                  <div className="space-y-2">
                    {papers.map((item, i) => (
                      <motion.div
                        key={item.paper.paperId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-3 hover:border-[var(--primary)]/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <a
                              href={item.paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--primary)] line-clamp-2 flex items-start gap-1"
                            >
                              {item.paper.title}
                              <ExternalLink className="w-3 h-3 shrink-0 mt-1 opacity-50" />
                            </a>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {item.paper.authors?.slice(0, 3).map((a) => a.name).join(", ")}
                              {item.paper.year ? ` (${item.paper.year})` : ""}
                              {item.paper.venue ? ` · ${item.paper.venue}` : ""}
                              {item.paper.citationCount ? ` · ${item.paper.citationCount} 引用` : ""}
                            </p>
                            {item.keyFinding && (
                              <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2">{item.keyFinding}.</p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full bg-${config.color}-500`} />
                            <span className="text-[10px] text-[var(--text-muted)]">{(item.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {results.length === 0 && !loading && !error && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
          <p className="text-[var(--text-muted)]">输入研究假设，快速判断文献支持方向</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">基于 Semantic Scholar 2 亿+ 论文库</p>
        </div>
      )}
    </div>
  );
}
