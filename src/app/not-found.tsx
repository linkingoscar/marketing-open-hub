import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="text-8xl font-bold gradient-text">404</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">页面未找到</h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          你访问的页面不存在，可能已被移动或删除。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Home className="w-4 h-4" /> 返回首页
          </Link>
          <Link href="/compare"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-card)] transition-colors">
            项目对比
          </Link>
        </div>
      </div>
    </div>
  );
}
