import { Rocket, GitFork, ExternalLink, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl hidden md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">MarTech Open Hub</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
              市场营销 × 消费者行为研究的开源项目发现平台。汇聚全球优质工具，助力数据驱动的营销决策。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">快速链接</h3>
            <ul className="space-y-2">
              {[
                { label: "全部项目", href: "/#categories" },
                { label: "工作台", href: "/workspace" },
                { label: "项目对比", href: "/compare" },
                { label: "API 设置", href: "/settings" },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">资源</h3>
            <ul className="space-y-2">
              {[
                { label: "GitHub 仓库", href: "https://github.com", icon: GitFork },
                { label: "文献搜索", href: "/workspace/literature", icon: ExternalLink },
                { label: "设置", href: "/settings", icon: ExternalLink },
              ].map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors flex items-center gap-2">
                    <link.icon className="w-3.5 h-3.5" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-[var(--border)]" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-tertiary)]">
          <p>© 2026 MarTech Open Hub. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-[var(--error)] fill-current" /> and Open Source
          </p>
        </div>
      </div>
    </footer>
  );
}
