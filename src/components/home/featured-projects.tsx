"use client";

import { motion } from "framer-motion";
import { projects } from "@/data/projects";
import { ProjectCard } from "./project-card";

export function FeaturedProjects() {
  const featured = projects.filter((p) => p.featured);
  return (
    <section id="featured" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4"><span className="gradient-text">精选推荐</span></h2>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">社区认可度最高、功能最完善的开源项目，适合快速上手</p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {featured.map((project) => <ProjectCard key={project.id} project={project} />)}
      </div>
    </section>
  );
}
