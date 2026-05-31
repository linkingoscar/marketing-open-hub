export type Category =
  | "ai-simulation"
  | "sentiment-analysis"
  | "user-behavior"
  | "marketing-mix"
  | "social-media"
  | "brand-monitoring"
  | "demand-validation"
  | "statistics-toolkit"
  | "customer-data-platform";

export type DataSource =
  | "xiaohongshu" | "douyin" | "weibo" | "wechat"
  | "amazon" | "twitter" | "reddit" | "youtube"
  | "google-play" | "app-store" | "trustpilot"
  | "stockx" | "tiktok" | "instagram";

export type AICapability =
  | "nlp" | "llm" | "traditional-ml" | "pure-stats"
  | "computer-vision" | "recommendation";

export interface Project {
  id: string;
  name: string;
  fullName: string;
  description: string;
  descriptionCN: string;
  url: string;
  homepage?: string;
  stars: number;
  forks: number;
  language: string;
  license: string;
  lastUpdated: string;
  createdAt: string;
  category: Category;
  tags: string[];
  scenarios: string[];
  dataSources: DataSource[];
  aiCapabilities: AICapability[];
  scores: {
    features: number;
    easeOfUse: number;
    documentation: number;
    community: number;
    performance: number;
  };
  icon: string;
  featured: boolean;
  relatedProjects: string[];
}

export interface CategoryInfo {
  id: Category;
  name: string;
  nameCN: string;
  icon: string;
  description: string;
  color: string;
}
