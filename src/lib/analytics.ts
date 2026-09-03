"use client";

/**
 * 隐私友好的用户分析和错误追踪
 *
 * 设计原则:
 * - 用户隐私优先，不收集个人身份信息
 * - 所有数据匿名化
 * - 支持 Do Not Track
 * - 本地开发环境不发送数据
 * - 可选集成，未配置时不报错
 */

// ===== 配置 =====
const ANALYTICS_ENABLED =
  typeof window !== "undefined" &&
  !window.location.hostname.includes("localhost") &&
  !navigator.doNotTrack;

// PostHog 配置（可选）
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

interface PostHogClient {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  set_config?: (config: Record<string, unknown>) => void;
}

function getPostHog(): PostHogClient | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { posthog?: PostHogClient }).posthog;
}

// ===== PostHog =====

let posthogInitialized = false;

/**
 * 初始化 PostHog（如果配置了 key）
 */
export function initPostHog() {
  if (!ANALYTICS_ENABLED || !POSTHOG_KEY || posthogInitialized) return;

  try {
    // 动态加载 PostHog
    const script = document.createElement("script");
    script.src = "https://app.posthog.com/static/array.js";
    script.async = true;
    script.onload = () => {
      const ph = getPostHog();
      if (ph) {
        ph.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false, // We'll handle manually
          capture_pageleave: false,
          autocapture: false, // Privacy: only track what we explicitly send
          persistence: "localStorage",
          opt_out_capturing_by_default: false,
          loaded: (client: PostHogClient) => {
            // Anonymize IP
            if (client.set_config) {
              client.set_config({ ip: false });
            }
            posthogInitialized = true;
            console.debug("[Analytics] PostHog initialized");
          },
        });
      }
    };
    document.head.appendChild(script);
  } catch (err) {
    console.debug("[Analytics] PostHog init failed:", err);
  }
}

/**
 * Track an event
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!ANALYTICS_ENABLED) return;

  try {
    const ph = getPostHog();
    if (ph) {
      ph.capture(event, {
        ...properties,
        $current_url: window.location.pathname, // Don't send full URL for privacy
      });
    }
  } catch {
    // Silently fail
  }

  // Also log to console in development
  if (typeof window !== "undefined" && window.location.hostname.includes("localhost")) {
    console.debug("[Analytics]", event, properties);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string) {
  trackEvent("$pageview", { $current_url: path });
}

// ===== Error & Message Logging =====

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error("[Error]", error, context);
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message: string, level: "info" | "warning" = "info") {
  if (level === "warning") {
    console.warn("[Message]", message);
  } else {
    console.info("[Message]", message);
  }
}

// ===== 学术研究平台特定事件 =====

/** 用户完成统计分析 */
export function trackStatisticalTest(testType: string, variables: number) {
  trackEvent("statistical_test_completed", {
    test_type: testType,
    variable_count: variables,
  });
}

/** 用户使用 AI 功能 */
export function trackAIFeature(feature: string, provider: string) {
  trackEvent("ai_feature_used", {
    feature,
    provider,
    // Don't track actual content for privacy
  });
}

/** 用户导出结果 */
export function trackExport(format: string, source: string) {
  trackEvent("result_exported", {
    format,
    source,
  });
}

/** 用户查看项目详情 */
export function trackProjectView(projectId: string, category: string) {
  trackEvent("project_viewed", {
    project_id: projectId,
    category,
  });
}

/** 用户搜索 */
export function trackSearch(query: string, resultCount: number) {
  trackEvent("search_performed", {
    query_length: query.length, // Don't send actual query for privacy
    result_count: resultCount,
  });
}
