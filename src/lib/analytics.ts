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

// Sentry DSN（可选）
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

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
      if (typeof window !== "undefined" && (window as any).posthog) {
        (window as any).posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false, // We'll handle manually
          capture_pageleave: false,
          autocapture: false, // Privacy: only track what we explicitly send
          persistence: "localStorage",
          opt_out_capturing_by_default: false,
          loaded: (ph: any) => {
            // Anonymize IP
            ph.set_config({ ip: false });
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
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.capture(event, {
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

// ===== Sentry (Error Tracking) =====

let sentryInitialized = false;

/**
 * 初始化 Sentry（如果配置了 DSN）
 */
export function initSentry() {
  if (!SENTRY_DSN || sentryInitialized) return;

  try {
    // 动态加载 Sentry
    const script = document.createElement("script");
    script.src = "https://browser.sentry-cdn.com/8.0.0/bundle.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.init({
          dsn: SENTRY_DSN,
          environment: process.env.NODE_ENV,
          tracesSampleRate: 0.1, // 10% of transactions
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0,
          integrations: [
            new (window as any).Sentry.BrowserTracing(),
          ],
          beforeSend(event: any) {
            // Don't send events from localhost
            if (window.location.hostname.includes("localhost")) return null;
            // Scrub any accidentally captured API keys
            if (event.request?.headers) {
              delete event.request.headers["Authorization"];
              delete event.request.headers["x-api-key"];
            }
            return event;
          },
        });
        sentryInitialized = true;
        console.debug("[ErrorTracking] Sentry initialized");
      }
    };
    document.head.appendChild(script);
  } catch (err) {
    console.debug("[ErrorTracking] Sentry init failed:", err);
  }
}

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error("[Error]", error, context);

  if (!SENTRY_DSN) return;

  try {
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.withScope((scope: any) => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        (window as any).Sentry.captureException(error);
      });
    }
  } catch {
    // Silently fail
  }
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message: string, level: "info" | "warning" = "info") {
  if (!SENTRY_DSN) return;

  try {
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, level);
    }
  } catch {
    // Silently fail
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
