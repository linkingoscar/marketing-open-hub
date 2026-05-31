import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { CommandPalette } from "@/components/search/command-palette";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarTech Open Hub — 市场营销开源项目发现平台",
    template: "%s | MarTech Open Hub",
  },
  description: "汇聚市场营销 × 消费者行为研究的开源项目，支持搜索、对比和快速上手。",
  keywords: ["市场营销", "开源", "消费者行为", "情感分析", "用户画像", "NLP", "AI", "market research"],
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
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366F1" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ErrorBoundary>
            <CommandPalette />
            <Navbar />
            <main className="flex-1 pt-16 pb-16 md:pb-0">{children}</main>
            <MobileTabBar />
            <Footer />
          </ErrorBoundary>
        </ThemeProvider>
        <Script id="sw-register" strategy="afterInteractive">{`
          if('serviceWorker' in navigator){
            navigator.serviceWorker.register('/sw.js').catch(()=>{})
          }
        `}</Script>
      </body>
    </html>
  );
}
