import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: "MarTech Open Hub — 市场营销开源项目发现平台",
      template: "%s | MarTech Open Hub",
    },
    description: "汇聚市场营销 × 消费者行为研究的开源项目，支持搜索、对比和快速上手。",
    keywords: [
      "市场营销", "开源", "消费者行为", "情感分析", "用户画像",
      "营销分析", "NLP", "AI", "market research", "open source",
    ],
    authors: [{ name: "MarTech Open Hub" }],
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: "https://martech-open-hub.vercel.app",
      siteName: "MarTech Open Hub",
      title: "MarTech Open Hub — 市场营销开源项目发现平台",
      description: "汇聚市场营销 × 消费者行为研究的开源项目，支持搜索、对比和快速上手。",
    },
    twitter: {
      card: "summary_large_image",
      title: "MarTech Open Hub — 市场营销开源项目发现平台",
      description: "汇聚市场营销 × 消费者行为研究的开源项目，支持搜索、对比和快速上手。",
    },
    robots: {
      index: true,
      follow: true,
    },
    manifest: "/manifest.json",
  };
}
