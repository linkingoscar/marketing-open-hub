"use client";

import { useEffect } from "react";
import { initSentry, initPostHog } from "@/lib/analytics";

/**
 * 初始化错误追踪和用户分析
 * 仅在客户端运行，不影响 SSR
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentry();
    initPostHog();
  }, []);

  return <>{children}</>;
}
