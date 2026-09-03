import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://linkingoscar.github.io/marketing-open-hub";

  return {
    title: {
      default: "Marketing Open Hub — Local-first Marketing & Consumer Research Workbench",
      template: "%s | Marketing Open Hub",
    },
    description:
      "A privacy-first, local-in-browser marketing research workbench: 36 statistical tests, PROCESS Model 4 Bootstrap mediation, Semantic Scholar literature discovery, and APA 7th Edition Word-ready table exports.",
    keywords: [
      "市场营销研究",
      "消费者行为学",
      "实证分析",
      "统计分析工具",
      "中介效应分析",
      "Bootstrap 中介",
      "PROCESS Model 4",
      "APA 第7版格式",
      "三线表导出",
      "Welch t 检验",
      "单因素 ANOVA",
      "卡方检验",
      "Pearson 相关",
      "文献挖掘",
      "Semantic Scholar",
      "SPSS 替代",
      "marketing science",
      "consumer research",
      "empirical research workbench",
      "statistical analysis",
      "mediation analysis",
      "hypothesis testing",
      "APA 7th edition table",
      "local-first",
      "open source",
    ],
    authors: [
      {
        name: "Marketing Open Hub Contributors",
        url: "https://github.com/linkingoscar/marketing-open-hub",
      },
    ],
    creator: "linkingoscar",
    openGraph: {
      type: "website",
      locale: "zh_CN",
      alternateLocale: "en_US",
      url: siteUrl,
      siteName: "Marketing Open Hub",
      title: "Marketing Open Hub — Local-first Marketing Research Workbench",
      description:
        "36 Statistical Tests · PROCESS Bootstrap Mediation · Literature Mining · Word-ready APA 7th Tables · 100% Local Browser Privacy.",
    },
    twitter: {
      card: "summary_large_image",
      title: "Marketing Open Hub — Local-first Marketing Research Workbench",
      description:
        "Open-source empirical marketing research workbench: statistical testing, mediation models, literature mining, and APA report generator.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    manifest: "/manifest.json",
  };
}
