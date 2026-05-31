import { CategoryInfo } from "./types";

export const categories: CategoryInfo[] = [
  { id: "ai-simulation", name: "AI Simulated Research", nameCN: "AI 模拟调研", icon: "🧪", description: "LLM 驱动的模拟焦点小组、问卷调研与市场研究", color: "#8B5CF6" },
  { id: "sentiment-analysis", name: "Sentiment Analysis", nameCN: "情感分析", icon: "💬", description: "基于 NLP 的情感分析、情绪检测与反馈挖掘", color: "#EC4899" },
  { id: "user-behavior", name: "User Behavior Analytics", nameCN: "用户行为分析", icon: "📊", description: "用户行为追踪、留存分析与意图推断", color: "#3B82F6" },
  { id: "marketing-mix", name: "Marketing Mix Modeling", nameCN: "营销组合建模", icon: "📈", description: "贝叶斯 MMM、CLV 建模与因果营销分析", color: "#10B981" },
  { id: "social-media", name: "Social Media Insights", nameCN: "社交媒体洞察", icon: "📱", description: "社媒趋势分析、内容传播预测与 PMF 验证", color: "#F59E0B" },
  { id: "brand-monitoring", name: "Brand Monitoring", nameCN: "品牌监测", icon: "🏷️", description: "AI 模型中的品牌可见性、社媒情感追踪与竞品分析", color: "#EF4444" },
  { id: "demand-validation", name: "Demand Validation", nameCN: "需求验证", icon: "✅", description: "创意验证、受众分析与市场机会评估", color: "#06B6D4" },
  { id: "statistics-toolkit", name: "Statistics Toolkit", nameCN: "统计工具箱", icon: "🧮", description: "面向市场研究者的统计方法——联合分析、MaxDiff、A/B 测试", color: "#A855F7" },
  { id: "customer-data-platform", name: "Customer Data Platform", nameCN: "客户数据平台", icon: "👥", description: "统一客户画像、分群与个性化营销", color: "#14B8A6" },
];

export function getCategoryById(id: string): CategoryInfo | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryColor(id: string): string {
  return getCategoryById(id)?.color ?? "#6366F1";
}
