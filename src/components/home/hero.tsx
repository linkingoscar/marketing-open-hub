"use client";

import { motion } from "framer-motion";
import { Search, ChevronDown, FolderOpen, Layers, Database, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useCountUp } from "@/hooks/use-count-up";
import { ParticleBackground } from "./particle-background";

const stats = [
  { label: "项目", value: 31, icon: FolderOpen, suffix: "+" },
  { label: "分类", value: 9, icon: Layers, suffix: "" },
  { label: "工具", value: 18, icon: Database, suffix: "" },
  { label: "Stars", value: 50, icon: Star, suffix: "K+" },
];

function StatCounter({ value, label, suffix, icon: Icon, delay }: { value: number; label: string; suffix: string; icon: React.ElementType; delay: number }) {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-[var(--primary-light)]" />
        <span ref={ref} className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{count}{suffix}</span>
      </div>
      <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
    </motion.div>
  );
}

export function Hero() {
  const typewriterText = useTypewriter(["消费者行为分析", "情感分析", "用户画像", "营销归因", "品牌监测", "需求验证"], 80, 40, 1800);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-primary)]/50 to-[var(--bg-primary)] z-[1]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/5 blur-[100px] z-[1]" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-sm text-sm text-[var(--text-secondary)] mb-8">
          <span>🚀</span><span>发现 31 个学术级开源项目，覆盖 9 大研究方向</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4">
          <span className="gradient-text">Marketing</span><br />
          <span className="text-[var(--text-primary)]">Open Hub</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg sm:text-xl text-[var(--text-secondary)] mb-4">市场营销开源项目发现平台</motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="h-8 mb-8 flex items-center justify-center">
          <span className="text-[var(--text-tertiary)]">专注</span>
          <span className="ml-2 text-[var(--primary-light)] font-medium font-mono">{typewriterText}</span>
          <span className="w-[2px] h-5 bg-[var(--primary)] animate-cursor ml-0.5" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}
          className="relative max-w-lg mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <Input placeholder="搜索项目、技术栈、场景..."
            onFocus={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            readOnly
            className="h-12 pl-12 pr-4 rounded-xl bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] backdrop-blur-xl focus:border-[var(--primary)] text-base cursor-pointer" />
        </motion.div>

        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {stats.map((stat, i) => <StatCounter key={stat.label} {...stat} delay={1.0 + i * 0.1} />)}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
          <span className="text-xs">向下探索</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}
