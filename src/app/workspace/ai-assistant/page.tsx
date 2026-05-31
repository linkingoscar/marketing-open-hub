"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2, Sparkles, Bot, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";
import { ActiveProviderBadge } from "@/components/workspace/active-provider";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "assistant"; content: string; tool?: string }

const QUICK_ACTIONS = [
  { label: "帮我分析这组数据的中介效应", tool: "empirical" },
  { label: "这组问卷数据信效度如何？", tool: "statistics" },
  { label: "帮我做 RFM 客户分群", tool: "clv" },
  { label: "分析这个产品的市场可行性", tool: "demand-validation" },
  { label: "帮我写论文的结果章节", tool: "paper-writer" },
  { label: "这组时间序列有什么趋势？", tool: "timeseries" },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hasAnyKey } = useAPIStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const SYSTEM_PROMPT = `你是一个市场营销和消费者行为研究的 AI 助手。你的职责是：
1. 理解用户的研究需求，推荐合适的分析工具和方法
2. 解释统计概念和分析结果
3. 帮助用户设计研究方案
4. 提供学术写作建议

当用户描述一个分析需求时，你应该：
1. 确认他们的研究问题和数据类型
2. 推荐最合适的工具（从以下工具中选择）
3. 解释为什么推荐这个工具
4. 提供具体的操作步骤

可用工具：
- 统计分析（37种检验：t检验、ANOVA、回归、信效度等）
- 情感分析（6种：情感/主题/画像/竞品/购买意向/自定义）
- 用户行为分析（漏斗/留存/RFM/同期群）
- 因果推断（Uplift/DiD/SCM/Granger）
- 客户价值（RFM分群/CLV预测）
- 时间序列（趋势分解/季节性/残差）
- 品牌监测（可见性/舆情/竞品/危机）
- 需求验证（创意验证/PMF/市场规模/定价）
- SEM 结构方程模型
- 实证分析工作台（PROCESS框架/构念分析）
- 论文写作辅助（方法/结果/讨论/摘要）
- 文献搜索（Semantic Scholar）
- 数据清洗（构念计算/反向题/缺失值/异常值）
- 贝叶斯分析（先验/后验/模型比较）

用中文回答，专业但易懂。`;

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || !hasAnyKey()) return;
    setInput("");
    setError("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const allMessages = [...messages, userMsg].map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
      const res = await callLLM({
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...allMessages],
        temperature: 0.5,
        maxTokens: 3000,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-4rem)]">
        <Link href="/workspace" className="inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> 返回工作台
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI 研究助手</h1>
            <p className="text-sm text-[var(--text-muted)]">对话式分析 · 自动推荐工具 · 结果解读</p>
          </div>
        </div>
        <ActiveProviderBadge className="mb-4" />

        {!hasAnyKey() && (
          <div className="glass-card p-4 mb-4 border-[var(--warning)]/30">
            <p className="text-sm text-[var(--warning)]">⚠️ 尚未配置 API Key。<Link href="/settings" className="underline ml-1">前往设置</Link></p>
          </div>
        )}

        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">你好，我是你的研究助手</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">告诉我你的研究需求，我会推荐最合适的工具和分析方法</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.label} onClick={() => handleSend(action.label)}
                    className="p-3 rounded-lg border border-[var(--border)] text-left text-xs text-[var(--text-secondary)] hover:border-[var(--primary)]/30 hover:bg-[var(--bg-card)] transition-all">
                    <Wrench className="w-3.5 h-3.5 mb-1 text-[var(--primary)]" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[var(--primary)]" />
                </div>
              )}
              <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-[var(--primary)] text-white rounded-br-md"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] rounded-bl-md border border-[var(--border)]"
              )}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-[var(--accent)]" />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="p-3 rounded-2xl rounded-bl-md bg-[var(--bg-card)] border border-[var(--border)]">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
              </div>
            </div>
          )}

          {error && <div className="text-sm text-[var(--error)] text-center">{error}</div>}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你的研究需求..."
            disabled={loading || !hasAnyKey()}
            className="h-12 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]"
          />
          <Button onClick={() => handleSend()} disabled={loading || !input.trim() || !hasAnyKey()}
            className="h-12 px-5 bg-[var(--primary)] text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
