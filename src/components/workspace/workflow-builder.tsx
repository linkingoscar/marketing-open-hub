"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, Circle, Clock, AlertTriangle, RotateCcw, Workflow, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORKFLOW_TEMPLATES,
  createWorkflow,
  getExecutableSteps,
  getWorkflowProgress,
  type Workflow as WorkflowType,
  type WorkflowStep,
} from "@/lib/workflow/engine";

interface WorkflowBuilderProps {
  onNavigate?: (path: string) => void;
  className?: string;
}

const STEP_ICONS: Record<string, string> = {
  "literature-search": "📚",
  "data-upload": "📁",
  "statistical-test": "🧮",
  "visualization": "📊",
  "ai-analysis": "🤖",
  "export": "📦",
};

const STATUS_CONFIG = {
  pending: { icon: Circle, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-card-hover)]", label: "等待中" },
  running: { icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10", label: "执行中" },
  completed: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "已完成" },
  failed: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10", label: "失败" },
  skipped: { icon: Circle, color: "text-[var(--text-muted)]", bg: "bg-[var(--bg-card-hover)]", label: "已跳过" },
};

export function WorkflowBuilder({ onNavigate, className }: WorkflowBuilderProps) {
  const [_workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const handleCreateFromTemplate = (templateIndex: number) => {
    const template = WORKFLOW_TEMPLATES[templateIndex];
    const workflow = createWorkflow(template);
    setWorkflows((prev) => [...prev, workflow]);
    setSelectedWorkflow(workflow);
  };

  const handleResetWorkflow = (workflowId: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === workflowId
          ? {
              ...wf,
              status: "draft" as const,
              steps: wf.steps.map((s) => ({ ...s, status: "pending" as const, result: undefined })),
              updatedAt: Date.now(),
            }
          : wf
      )
    );
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow((prev) =>
        prev
          ? {
              ...prev,
              status: "draft",
              steps: prev.steps.map((s) => ({ ...s, status: "pending" as const, result: undefined })),
            }
          : null
      );
    }
  };

  const handleStepAction = (step: WorkflowStep) => {
    if (step.type === "data-upload") {
      // Navigate to statistics page for data upload
      onNavigate?.("/workspace/statistics");
    } else if (step.type === "statistical-test") {
      // Navigate to statistics page with test pre-selected
      onNavigate?.("/workspace/statistics");
    } else if (step.type === "literature-search") {
      onNavigate?.("/workspace/literature");
    } else if (step.type === "visualization") {
      onNavigate?.("/workspace/statistics");
    } else if (step.type === "export") {
      onNavigate?.("/workspace/statistics");
    } else if (step.type === "ai-analysis") {
      onNavigate?.("/workspace/ai-assistant");
    }

    // Mark step as running
    if (selectedWorkflow) {
      const updated = {
        ...selectedWorkflow,
        steps: selectedWorkflow.steps.map((s) => (s.id === step.id ? { ...s, status: "running" as const } : s)),
      };
      setSelectedWorkflow(updated);
      setWorkflows((prev) => prev.map((wf) => (wf.id === updated.id ? updated : wf)));
    }
  };

  const handleCompleteStep = (stepId: string) => {
    if (selectedWorkflow) {
      const updated = {
        ...selectedWorkflow,
        steps: selectedWorkflow.steps.map((s) => (s.id === stepId ? { ...s, status: "completed" as const } : s)),
        updatedAt: Date.now(),
      };
      // Check if all steps are completed
      const allDone = updated.steps.every((s) => s.status === "completed" || s.status === "skipped");
      updated.status = allDone ? "completed" : "running";
      setSelectedWorkflow(updated);
      setWorkflows((prev) => prev.map((wf) => (wf.id === updated.id ? updated : wf)));
    }
  };

  const progress = selectedWorkflow ? getWorkflowProgress(selectedWorkflow) : null;
  const executableSteps = selectedWorkflow ? getExecutableSteps(selectedWorkflow) : [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Template selection */}
      {!selectedWorkflow && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">选择研究工作流模板</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKFLOW_TEMPLATES.map((template, i) => (
              <motion.button
                key={template.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleCreateFromTemplate(i)}
                className="glass-card p-4 text-left hover:border-[var(--primary)]/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Workflow className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)]">{template.name}</h4>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-3">{template.description}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
                  <span>{template.steps.length} 步骤</span>
                  <span>·</span>
                  <span>{template.steps.filter((s) => s.type === "statistical-test").length} 项统计检验</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Active workflow */}
      {selectedWorkflow && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{selectedWorkflow.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">{selectedWorkflow.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetWorkflow(selectedWorkflow.id)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> 重置
              </button>
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
              >
                返回列表
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {progress && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)]">进度</span>
                <span className="text-xs font-mono text-[var(--text-primary)]">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                />
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {selectedWorkflow.steps.map((step, i) => {
              const config = STATUS_CONFIG[step.status];
              const isExecutable = executableSteps.some((s) => s.id === step.id);
              const isExpanded = expandedStep === step.id;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "glass-card p-3 transition-all",
                    isExecutable && "border-[var(--primary)]/30",
                    step.status === "completed" && "opacity-75"
                  )}
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    {/* Step number */}
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", config.bg, config.color)}>
                      {step.status === "completed" ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>

                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{STEP_ICONS[step.type]}</span>
                        <span className={cn("text-sm font-medium", step.status === "completed" ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]")}>
                          {step.label}
                        </span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px]", config.bg, config.color)}>{config.label}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.description}</p>
                    </div>

                    {/* Expand/collapse */}
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                          {/* Dependencies */}
                          {step.dependsOn.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                              <span>依赖：</span>
                              {step.dependsOn.map((depId) => {
                                const dep = selectedWorkflow.steps.find((s) => s.id === depId);
                                return (
                                  <span key={depId} className="px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[10px]">
                                    {dep?.label ?? depId}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Action button */}
                          {isExecutable && (
                            <button
                              onClick={() => handleStepAction(step)}
                              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:opacity-90 flex items-center gap-2"
                            >
                              <Play className="w-3 h-3" /> 前往执行
                            </button>
                          )}

                          {/* Complete button (for demo) */}
                          {step.status === "running" && (
                            <button
                              onClick={() => handleCompleteStep(step.id)}
                              className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:opacity-90 flex items-center gap-2"
                            >
                              <CheckCircle className="w-3 h-3" /> 标记完成
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Completion message */}
          {selectedWorkflow.status === "completed" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 text-center border-emerald-500/30">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">工作流完成！</h3>
              <p className="text-sm text-[var(--text-muted)]">所有步骤已完成，研究流程已结束。</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
