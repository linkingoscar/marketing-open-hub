"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ExternalLink, BookOpen, Users, Calendar, Quote, Loader2, Filter, TrendingUp, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchPapers, type SemanticScholarPaper } from "@/lib/api/semantic-scholar";
import { ConsensusMeter } from "@/components/workspace/consensus-meter";
import { StructuredExtractor } from "@/components/workspace/structured-extractor";
import { cn } from "@/lib/utils";

const FIELDS = [
  "Computer Science", "Medicine", "Psychology", "Business",
  "Economics", "Sociology", "Engineering", "Mathematics",
  "Biology", "Chemistry", "Physics", "Materials Science",
];

const YEAR_PRESETS = ["", "2024-2026", "2020-2026", "2015-2026", "2010-2026"];

export default function LiteraturePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SemanticScholarPaper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<SemanticScholarPaper | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "consensus" | "extract">("search");

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await searchPapers(query, 20, yearFilter || undefined, selectedFields.length > 0 ? selectedFields : undefined);
      setResults(res.papers);
      setTotal(res.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "搜索失败");
    } finally {
      setLoading(false);
    }
  }, [query, yearFilter, selectedFields]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) => prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-xl">📚</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">文献搜索</h1>
            <p className="text-sm text-[var(--text-muted)]">基于 Semantic Scholar · 免费 API · 2 亿+ 学术论文</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-4">搜索学术论文，筛选领域和年份，查看摘要和引用数</p>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
          <button
            onClick={() => setActiveTab("search")}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "search" ? "bg-[var(--primary)] text-white" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Search className="w-4 h-4" /> 文献搜索
          </button>
          <button
            onClick={() => setActiveTab("consensus")}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "consensus" ? "bg-[var(--primary)] text-white" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            )}
          >
            <TrendingUp className="w-4 h-4" /> 证据方向
          </button>
          <button
            onClick={() => setActiveTab("extract")}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2",
              activeTab === "extract" ? "bg-[var(--primary)] text-white" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            )}
          >
            <Table2 className="w-4 h-4" /> 结构化提取
          </button>
        </div>

        {/* Consensus Meter Tab */}
        {activeTab === "consensus" && <ConsensusMeter />}

        {/* Structured Extractor Tab */}
        {activeTab === "extract" && <StructuredExtractor />}

        {/* Search Tab */}
        {activeTab === "search" && (<>
        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索论文标题、关键词、作者..."
              className="pl-10 h-12 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] text-base"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()}
            className="h-12 px-6 bg-[var(--primary)] text-white hover:opacity-90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "搜索"}
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
            className="h-12 px-3 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)]">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="glass-card p-4 mb-6 space-y-3">
            <div>
              <span className="text-xs text-[var(--text-muted)] mb-2 block">年份范围</span>
              <div className="flex flex-wrap gap-2">
                {YEAR_PRESETS.map((y) => (
                  <button key={y || "all"} onClick={() => setYearFilter(y)}
                    className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                      yearFilter === y ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
                    )}>
                    {y || "全部"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] mb-2 block">学科领域</span>
              <div className="flex flex-wrap gap-2">
                {FIELDS.map((f) => (
                  <button key={f} onClick={() => toggleField(f)}
                    className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                      selectedFields.includes(f) ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border)] text-[var(--text-tertiary)]"
                    )}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        {total > 0 && (
          <p className="text-sm text-[var(--text-muted)] mb-4">
            找到 {total.toLocaleString()} 篇论文，显示前 {results.length} 篇
          </p>
        )}

        {error && (
          <div className="glass-card p-4 mb-6 border-[var(--error)]/30">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {results.map((paper, i) => (
            <motion.div key={paper.paperId}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedPaper(selectedPaper?.paperId === paper.paperId ? null : paper)}
              className="glass-card p-5 cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary-light)] transition-colors mb-1 line-clamp-2">
                    {paper.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] mb-2">
                    {paper.authors.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {paper.authors.slice(0, 3).map((a) => a.name).join(", ")}
                        {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
                      </span>
                    )}
                    {paper.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{paper.year}
                      </span>
                    )}
                    {paper.venue && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />{paper.venue}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Quote className="w-3 h-3" />{paper.citationCount} 引用
                    </span>
                  </div>
                  {paper.abstract && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{paper.abstract}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {paper.fieldsOfStudy?.slice(0, 3).map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px] border-[var(--border)] text-[var(--text-muted)]">{f}</Badge>
                    ))}
                    {paper.isOpenAccess && (
                      <Badge variant="outline" className="text-[10px] border-[var(--success)]/30 text-[var(--success)]">开放获取</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-lg font-bold text-[var(--text-primary)]">{paper.citationCount}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">引用</span>
                  {paper.isOpenAccess && paper.openAccessPdf && (
                    <a href={paper.openAccessPdf.url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-0.5">
                      PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {selectedPaper?.paperId === paper.paperId && paper.abstract && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-[var(--border)]">
                  <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">摘要</h4>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{paper.abstract}</p>
                  <div className="mt-3 flex gap-2">
                    <a href={paper.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
                      <ExternalLink className="w-3 h-3" /> Semantic Scholar
                    </a>
                    {paper.isOpenAccess && paper.openAccessPdf && (
                      <a href={paper.openAccessPdf.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[var(--success)] hover:underline">
                        <ExternalLink className="w-3 h-3" /> PDF 全文
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">搜索学术论文</p>
            <p className="text-sm">输入关键词开始搜索，支持中英文</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["consumer behavior", "sentiment analysis", "marketing mix model", "brand equity", "purchase intention"].map((q) => (
                <button key={q} onClick={() => { setQuery(q); }}
                  className="px-3 py-1 rounded-full text-xs border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        </>)}
      </motion.div>
    </div>
  );
}
