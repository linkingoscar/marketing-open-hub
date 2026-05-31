"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ExternalLink, GitFork, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { projects } from "@/data/projects";
import { getCategoryById, getCategoryColor } from "@/data/categories";

type ToolLink = {
  href: string;
  title: string;
  desc: string;
};

const defaultTools: ToolLink[] = [
  { href: "/workspace/statistics", title: "统计分析", desc: "36 种检验方法，自动生成 APA 结果段落" },
  { href: "/workspace/data-clean", title: "数据清洗", desc: "构念得分、反向题、缺失值、异常值与 CSV 导出" },
  { href: "/workspace/paper-writer", title: "论文写作辅助", desc: "把研究信息和统计结果转成学术段落" },
];

const categoryToolMap: Record<string, ToolLink[]> = {
  "ai-simulation": [
    { href: "/workspace/synthetic-research", title: "AI 模拟调研", desc: "生成虚拟样本、模拟访谈和市场反馈" },
    { href: "/workspace/sentiment", title: "情感分析", desc: "提取情绪、主题、购买意向与用户画像" },
    { href: "/workspace/paper-writer", title: "论文写作辅助", desc: "将模拟研究结果转成 APA 风格文本" },
  ],
  "sentiment-analysis": [
    { href: "/workspace/sentiment", title: "情感分析", desc: "支持情感、主题、用户画像、竞品和购买意向" },
    { href: "/workspace/brand-monitoring", title: "品牌监测", desc: "品牌可见性、舆情、竞品对比和危机预警" },
    { href: "/workspace/user-behavior", title: "用户行为分析", desc: "结合事件日志做漏斗、留存、RFM 与同期群" },
  ],
  "user-behavior": [
    { href: "/workspace/user-behavior", title: "用户行为分析", desc: "漏斗、留存、RFM、同期群与 AI 洞察" },
    { href: "/workspace/clv", title: "客户价值", desc: "RFM、CLV、流失风险和客户分群" },
    { href: "/workspace/data-clean", title: "数据清洗", desc: "先处理事件日志中的缺失、异常和字段问题" },
  ],
  "marketing-mix": [
    { href: "/workspace/causal", title: "因果推断", desc: "Uplift、DID、合成控制和 Granger 因果检验" },
    { href: "/workspace/timeseries", title: "时间序列", desc: "趋势分解、预测、异常检测和 AI 解读" },
    { href: "/workspace/bayesian", title: "贝叶斯分析面板", desc: "先验、后验、贝叶斯因子和敏感性分析" },
  ],
  "social-media": [
    { href: "/workspace/sentiment", title: "情感分析", desc: "分析社媒评论、主题和购买意向" },
    { href: "/workspace/brand-monitoring", title: "品牌监测", desc: "追踪品牌声量、舆情和竞品变化" },
    { href: "/workspace/demand-validation", title: "需求验证", desc: "验证创意、PMF、市场规模和定价策略" },
  ],
  "brand-monitoring": [
    { href: "/workspace/brand-monitoring", title: "品牌监测", desc: "品牌可见性、舆情监测、竞品对比和危机预警" },
    { href: "/workspace/sentiment", title: "情感分析", desc: "从文本反馈中抽取情绪和方面级结论" },
    { href: "/workspace/literature", title: "文献搜索", desc: "检索品牌与传播研究相关论文" },
  ],
  "demand-validation": [
    { href: "/workspace/demand-validation", title: "需求验证", desc: "创意验证、PMF、市场规模和定价策略" },
    { href: "/workspace/synthetic-research", title: "AI 模拟调研", desc: "先用虚拟受访者快速探索需求假设" },
    { href: "/workspace/paper-writer", title: "论文写作辅助", desc: "把验证结果组织成研究报告段落" },
  ],
  "statistics-toolkit": defaultTools,
  "customer-data-platform": [
    { href: "/workspace/clv", title: "客户价值", desc: "CLV、RFM、流失风险和客户分群" },
    { href: "/workspace/user-behavior", title: "用户行为分析", desc: "分析事件路径、留存和同期群表现" },
    { href: "/workspace/data-clean", title: "数据清洗", desc: "整理客户数据字段并导出可分析 CSV" },
  ],
};

export default function ToolPage() {
  const params = useParams();
  const tool = params.tool as string;

  // Find project by matching tool route
  const routeMap: Record<string, string> = {
    "user-behavior": "zengrowth",
    "marketing-mix": "pymc-marketing",
    "social-media": "ripple",
    "brand-monitoring": "geo-insight",
    "demand-validation": "ideacan",
    "cdp": "leo-cdp",
  };
  const projectId = routeMap[tool];
  const project = projectId ? projects.find((p) => p.id === projectId) : null;
  const cat = project ? getCategoryById(project.category) : null;
  const catColor = project ? getCategoryColor(project.category) : "#6366F1";
  const suggestedTools = project ? (categoryToolMap[project.category] ?? defaultTools) : defaultTools;

  // Get all projects in this category
  const categoryProjects = project ? projects.filter((p) => p.category === project.category) : [];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        {project ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${catColor}15` }}>
                {project.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
                <p className="text-sm text-[var(--text-muted)] font-mono">{project.fullName}</p>
              </div>
            </div>
            <p className="text-[var(--text-secondary)] mb-6">{project.descriptionCN}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline" style={{ borderColor: `${catColor}40`, color: catColor }}>{cat?.nameCN}</Badge>
              <Badge variant="outline" className="border-[var(--border)] text-[var(--text-muted)]">{project.language}</Badge>
              <Badge variant="outline" className="border-[var(--border)] text-[var(--text-muted)]">{project.license || "—"}</Badge>
            </div>

            <div className="glass-card p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">可直接使用的分析入口</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {suggestedTools.map((item) => (
                  <Link key={item.href} href={item.href}
                    className="rounded-lg border border-[var(--border)] p-4 hover:border-[var(--primary)]/50 hover:bg-[var(--bg-card)] transition-colors group">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
                      <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href={project.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
                  <GitFork className="w-4 h-4" /> GitHub 仓库
                </a>
                {project.homepage && (
                  <a href={project.homepage} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-card)] transition-colors">
                    <ExternalLink className="w-4 h-4" /> 官网
                  </a>
                )}
              </div>
            </div>

            {/* Related projects in same category */}
            {categoryProjects.length > 1 && (
              <div>
                <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">同分类项目</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryProjects.filter((p) => p.id !== project.id).map((p) => (
                    <Link key={p.id} href={`/project/${p.id}`}
                      className="glass-card p-4 flex items-center gap-3 group cursor-pointer block">
                      <span className="text-lg">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary-light)] transition-colors truncate">{p.name}</div>
                        <div className="text-xs text-[var(--text-muted)] truncate">{p.descriptionCN}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">研究工具入口</h1>
            <p className="text-sm text-[var(--text-secondary)] mb-6">未匹配到专属项目，下面这些工具可以覆盖常见营销与消费者行为研究流程。</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {suggestedTools.map((item) => (
                <Link key={item.href} href={item.href}
                  className="glass-card p-4 flex flex-col gap-2 group">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
