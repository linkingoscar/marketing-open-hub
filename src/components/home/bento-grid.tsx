"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { categories } from "@/data/categories";
import { projects } from "@/data/projects";

export function BentoGrid() {
  return (
    <section id="categories" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          探索 <span className="gradient-text">9 大</span> 研究方向
        </h2>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          从 AI 模拟调研到统计工具箱，覆盖市场营销与消费者行为研究的完整链路
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, index) => {
          const count = projects.filter((p) => p.category === cat.id).length;
          return (
            <motion.a key={cat.id} href={`/category/${cat.id}`}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="group relative glass-card p-6 cursor-pointer overflow-hidden block">
              <div className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity" style={{ background: cat.color }} />
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-3xl" style={{ background: cat.color }} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: `${cat.color}33`, color: cat.color, background: `${cat.color}10` }}>
                    {count} 项目
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary-light)] transition-colors">{cat.nameCN}</h3>
                <p className="text-sm text-[var(--text-tertiary)] leading-relaxed line-clamp-2">{cat.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">
                  <span>查看详情</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
