"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/analytics";

/**
 * 初始化用户行为分析 (PostHog)
 * 仅在客户端运行，不影响 SSR
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
