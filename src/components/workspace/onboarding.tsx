"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Rocket, Key, BookOpen, BarChart3, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore, ONBOARDING_STEPS } from "@/lib/stores/workspace";
import { useAPIStore } from "@/lib/api/config";
import Link from "next/link";

// Step icons
const STEP_ICONS: Record<string, React.ReactNode> = {
  welcome: <Rocket className="w-8 h-8" />,
  "api-setup": <Key className="w-8 h-8" />,
  workspace: <BookOpen className="w-8 h-8" />,
  statistics: <BarChart3 className="w-8 h-8" />,
  templates: <FileText className="w-8 h-8" />,
  complete: <CheckCircle className="w-8 h-8" />,
};

export function OnboardingOverlay() {
  const { hasSeenOnboarding, currentStep, markSeen, nextStep } = useOnboardingStore();
  const { hasAnyKey } = useAPIStore();
  const [isOpen, setIsOpen] = useState(false);

  // Show onboarding for first-time users after a delay
  useEffect(() => {
    if (hasSeenOnboarding) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasSeenOnboarding]);

  const handleClose = () => {
    setIsOpen(false);
    markSeen();
  };

  const handleNext = () => {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      handleClose();
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    // We don't have prevStep, so just close and let them reopen
    // Actually, let me add it
  };

  if (!isOpen || hasSeenOnboarding) return null;

  const step = ONBOARDING_STEPS[currentStep] ?? ONBOARDING_STEPS[0];
  const isFirst = currentStep === 0;
  const isLast = currentStep >= ONBOARDING_STEPS.length - 1;
  const apiConfigured = hasAnyKey();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          <div className="h-1 bg-[var(--bg-tertiary)]">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-6">
              {STEP_ICONS[step.id] ?? <Rocket className="w-8 h-8" />}
            </div>

            {/* Step counter */}
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </p>

            {/* Title */}
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              {step.description}
            </p>

            {/* API status hint */}
            {step.id === "api-setup" && (
              <div className={`p-3 rounded-lg mb-6 ${apiConfigured ? "bg-[var(--success)]/10 border border-[var(--success)]/20" : "bg-[var(--warning)]/10 border border-[var(--warning)]/20"}`}>
                <p className={`text-sm ${apiConfigured ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>
                  {apiConfigured ? "✓ API 已配置，AI 工具可直接使用" : "尚未配置 API Key，推荐 DeepSeek（性价比最高）"}
                </p>
              </div>
            )}

            {/* Completion hint */}
            {step.id === "complete" && (
              <div className="p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-6">
                <p className="text-sm text-[var(--primary)]">
                  💡 提示：随时可通过 Cmd+K / Ctrl+K 快速搜索项目和工具
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {!isFirst && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => useOnboardingStore.getState().resetOnboarding()}
                    className="text-[var(--text-muted)]"
                  >
                    重置
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-[var(--text-muted)]">
                  跳过
                </Button>

                {step.id === "api-setup" && !apiConfigured ? (
                  <Link href="/settings">
                    <Button size="sm" className="bg-[var(--primary)] text-white hover:opacity-90">
                      去配置 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-[var(--primary)] text-white hover:opacity-90"
                  >
                    {isLast ? "开始使用" : "下一步"}
                    {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 pb-6">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep
                    ? "bg-[var(--primary)]"
                    : i < currentStep
                    ? "bg-[var(--primary)]/40"
                    : "bg-[var(--bg-tertiary)]"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 手动触发引导的按钮（用于导航栏或设置页）
 */
export function OnboardingTrigger() {
  const { resetOnboarding } = useOnboardingStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        resetOnboarding();
        // Force re-render by dispatching event
        window.dispatchEvent(new Event("storage"));
      }}
      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    >
      <Rocket className="w-4 h-4 mr-2" />
      新手引导
    </Button>
  );
}
