"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { WorkflowBuilder } from "@/components/workspace/workflow-builder";

export default function WorkflowPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-xl">🔄</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">研究工作流</h1>
            <p className="text-sm text-[var(--text-muted)]">可视化研究流程编排 · 预设模板 · 步骤依赖管理</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">选择预设模板或创建自定义工作流，平台会引导你完成每一步分析。</p>

        <WorkflowBuilder onNavigate={(path) => router.push(path)} />
      </motion.div>
    </div>
  );
}
