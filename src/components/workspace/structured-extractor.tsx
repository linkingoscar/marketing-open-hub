"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, Loader2, ExternalLink, Table2 } from "lucide-react";
import { searchPapers, type SemanticScholarPaper } from "@/lib/api/semantic-scholar";

interface ExtractedPaper {
  paper: SemanticScholarPaper;
  sampleSize: string;
  method: string;
  industry: string;
  region: string;
  keyFinding: string;
  effectSize: string;
}

/**
 * 结构化文献提取表（Elicit 式）
 * 搜索文献 → 自动提取结构化字段 → 可编辑表格 → 导出 CSV
 */
export function StructuredExtractor() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ExtractedPaper[]>([]);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState<keyof ExtractedPaper>("paper");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const searchResult = await searchPapers(query, 25);

      if (searchResult.papers.length === 0) {
        setError("未找到相关文献。请尝试其他关键词。");
        return;
      }

      // Extract structured fields from abstracts
      const extracted: ExtractedPaper[] = searchResult.papers
        .filter((p) => p.abstract)
        .map((paper) => {
          const abstract = paper.abstract ?? "";

          // Extract sample size (N=xxx)
          const nMatch = abstract.match(/[Nn]\s*=\s*(\d[\d,]*)/);
          const sampleSize = nMatch ? nMatch[1].replace(/,/g, "") : "—";

          // Extract method
          const methods = [
            "survey", "experiment", "SEM", "regression", "ANOVA", "t-test",
            "questionnaire", "interview", "focus group", "meta-analysis",
            "longitudinal", "cross-sectional", "case study", "RCT",
            "structural equation", "factor analysis", "cluster analysis",
          ];
          const foundMethods = methods.filter((m) => abstract.toLowerCase().includes(m.toLowerCase()));
          const method = foundMethods.length > 0 ? foundMethods.slice(0, 2).join(", ") : "—";

          // Extract industry context
          const industries = [
            "e-commerce", "retail", "social media", "banking", "healthcare",
            "education", "tourism", "hospitality", "automotive", "fashion",
            "food", "technology", "telecom", "insurance", "real estate",
            "电商", "零售", "金融", "教育", "旅游",
          ];
          const foundIndustry = industries.find((ind) => abstract.toLowerCase().includes(ind.toLowerCase()));
          const industry = foundIndustry ?? "—";

          // Extract region
          const regions = [
            "China", "USA", "UK", "Europe", "Asia", "India", "Japan",
            "Korea", "Germany", "Australia", "Canada", "Brazil",
            "中国", "美国", "欧洲", "亚洲",
          ];
          const foundRegion = regions.find((r) => abstract.includes(r));
          const region = foundRegion ?? "—";

          // Extract key finding (first sentence)
          const firstSentence = abstract.split(".")[0] ?? "";
          const keyFinding = firstSentence.length > 150 ? firstSentence.slice(0, 150) + "..." : firstSentence;

          // Extract effect size
          const effectMatch = abstract.match(/(?:d|η²|ω²|r|β|OR)\s*=\s*([−-]?\d+\.?\d*)/);
          const effectSize = effectMatch ? effectMatch[0] : "—";

          return { paper, sampleSize, method, industry, region, keyFinding, effectSize };
        });

      setResults(extracted);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "搜索失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;

    const headers = ["标题", "作者", "年份", "期刊", "引用数", "样本量", "方法", "行业", "地区", "关键发现", "效应量", "链接"];
    const rows = results.map((r) => [
      r.paper.title,
      r.paper.authors?.map((a) => a.name).join("; ") ?? "",
      r.paper.year ?? "",
      r.paper.venue ?? "",
      r.paper.citationCount ?? "",
      r.sampleSize,
      r.method,
      r.industry,
      r.region,
      r.keyFinding,
      r.effectSize,
      r.paper.url,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `literature-extraction-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (field: keyof ExtractedPaper) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const dir = sortDir === "asc" ? 1 : -1;
    if (typeof aVal === "string" && typeof bVal === "string") return aVal.localeCompare(bVal) * dir;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="输入研究主题（如：consumer behavior social media marketing）"
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 h-12 rounded-xl bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          提取
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header with export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">提取结果</span>
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--primary)]/10 text-[var(--primary)]">{results.length} 篇</span>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> 导出 CSV
            </button>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-card-hover)]">
                    {[
                      { key: "paper", label: "论文" },
                      { key: "sampleSize", label: "样本量" },
                      { key: "method", label: "方法" },
                      { key: "industry", label: "行业" },
                      { key: "region", label: "地区" },
                      { key: "effectSize", label: "效应量" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key as keyof ExtractedPaper)}
                        className="text-left py-2 px-3 text-[var(--text-muted)] font-medium cursor-pointer hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
                      >
                        {col.label}
                        {sortField === col.key && (
                          <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((item) => (
                    <tr key={item.paper.paperId} className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="py-2 px-3 max-w-xs">
                        <a
                          href={item.paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium line-clamp-2 flex items-start gap-1"
                        >
                          {item.paper.title}
                          <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                        </a>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {item.paper.authors?.slice(0, 2).map((a) => a.name).join(", ")}
                          {item.paper.year ? ` (${item.paper.year})` : ""}
                        </p>
                      </td>
                      <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">{item.sampleSize}</td>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{item.method}</td>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{item.industry}</td>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{item.region}</td>
                      <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">{item.effectSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">{results.length}</p>
              <p className="text-[10px] text-[var(--text-muted)]">论文总数</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {results.filter((r) => r.sampleSize !== "—").length}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">报告样本量</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {new Set(results.filter((r) => r.method !== "—").flatMap((r) => r.method.split(", "))).size}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">研究方法类型</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {new Set(results.filter((r) => r.industry !== "—").map((r) => r.industry)).size}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">覆盖行业</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {results.length === 0 && !loading && !error && (
        <div className="text-center py-16">
          <Table2 className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
          <p className="text-[var(--text-muted)]">输入研究主题，自动提取文献的关键字段</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">提取样本量、方法、行业、地区、效应量等结构化信息</p>
        </div>
      )}
    </div>
  );
}
