"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 工具间数据流转 Store
 * 允许用户在不同工具之间传递数据（如统计分析结果 → 图表可视化）
 */
interface DataTransferStore {
  /** 最近一次分析结果 */
  lastAnalysisResult: {
    toolId: string;
    toolName: string;
    timestamp: number;
    data: unknown;
    format: "csv" | "json" | "table";
  } | null;

  /** 保存分析结果供其他工具使用 */
  saveResult: (toolId: string, toolName: string, data: unknown, format: "csv" | "json" | "table") => void;

  /** 清除保存的结果 */
  clearResult: () => void;

  /** 检查是否有可用的传递数据 */
  hasTransferData: () => boolean;
}

export const useDataTransferStore = create<DataTransferStore>()(
  persist(
    (set, get) => ({
      lastAnalysisResult: null,

      saveResult: (toolId, toolName, data, format) =>
        set({
          lastAnalysisResult: {
            toolId,
            toolName,
            timestamp: Date.now(),
            data,
            format,
          },
        }),

      clearResult: () => set({ lastAnalysisResult: null }),

      hasTransferData: () => get().lastAnalysisResult !== null,
    }),
    { name: "martech-data-transfer" }
  )
);

/**
 * 工作台新手引导状态
 */
interface OnboardingStore {
  hasSeenOnboarding: boolean;
  currentStep: number;
  markSeen: () => void;
  nextStep: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      hasSeenOnboarding: false,
      currentStep: 0,

      markSeen: () => set({ hasSeenOnboarding: true }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      resetOnboarding: () => set({ hasSeenOnboarding: false, currentStep: 0 }),
    }),
    { name: "martech-onboarding" }
  )
);

/** 引导步骤定义 */
export const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "欢迎来到 MarTech Open Hub",
    description: "这里是市场营销研究者的工具箱。让我们快速了解如何使用。",
    target: null, // Full screen overlay
  },
  {
    id: "api-setup",
    title: "第一步：配置 API Key",
    description: "AI 功能需要 LLM API Key。推荐 DeepSeek（性价比最高）。配置后所有 AI 工具即可使用。",
    target: "/settings",
  },
  {
    id: "workspace",
    title: "第二步：探索工作台",
    description: "18 个交互式工具覆盖统计分析、情感分析、文献搜索等。点击任意工具卡片开始。",
    target: "/workspace",
  },
  {
    id: "statistics",
    title: "核心功能：统计分析",
    description: "支持 36 种统计检验，自动输出 APA 格式 + 通俗解释 + 应用建议。上传 CSV 或使用内置数据集。",
    target: "/workspace/statistics",
  },
  {
    id: "templates",
    title: "快速开始：营销模板",
    description: "10 个预设研究场景（品牌认知、A/B 测试、满意度等），按流程指引完成分析。",
    target: "/workspace/templates",
  },
  {
    id: "complete",
    title: "准备就绪！",
    description: "你已了解核心功能。随时可以开始你的第一个研究分析。",
    target: null,
  },
];
