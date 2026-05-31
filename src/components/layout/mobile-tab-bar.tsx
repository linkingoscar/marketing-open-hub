"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, GitCompare, Wrench, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { icon: Home, label: "首页", href: "/" },
  { icon: Layers, label: "分类", href: "/#categories" },
  { icon: Wrench, label: "工作台", href: "/workspace" },
  { icon: GitCompare, label: "对比", href: "/compare" },
  { icon: Settings, label: "设置", href: "/settings" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link key={tab.label} href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--primary)]"
              )}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
