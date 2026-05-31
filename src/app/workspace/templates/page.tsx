"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { TemplateSelector } from "@/components/workspace/template-selector";

export default function TemplatesPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-xl">📋</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">营销研究模板库</h1>
            <p className="text-sm text-[var(--text-muted)]">10 个预设场景 · 推荐方法 · 示例数据结构 · 参考文献</p>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] mb-6">选择一个研究场景，平台会推荐合适的统计方法、数据结构和分析流程。降低入门门槛，快速上手。</p>

        <TemplateSelector onSelect={() => {}} />
      </motion.div>
    </div>
  );
}
