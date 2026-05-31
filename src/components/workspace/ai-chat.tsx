"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, BookOpen, BarChart3, Lightbulb, Copy, Check, RotateCcw } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";
import { callLLM } from "@/lib/api/client";
import { useAPIStore } from "@/lib/api/config";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  sources?: { title: string; url: string }[];
}

interface AIChatProps {
  context?: string; // Additional context (e.g., analysis results, literature)
  className?: string;
}

const QUICK_ACTIONS = [
  { label: "解释这个统计结果", icon: BarChart3, prompt: "请用通俗易懂的语言解释以下统计结果的实际意义：" },
  { label: "推荐研究方法", icon: Lightbulb, prompt: "基于我的研究问题，请推荐合适的统计方法和分析流程：" },
  { label: "帮我写结果描述", icon: BookOpen, prompt: "请帮我将以下统计结果写成符合 APA 格式的结果描述段落：" },
  { label: "分析文献趋势", icon: BookOpen, prompt: "请分析以下文献的研究趋势和主要发现：" },
];

export function AIChat({ context, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { hasAnyKey } = useAPIStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    const msgId = crypto.randomUUID();
    const userMessage: Message = {
      id: msgId,
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = `你是一个专业的市场营销研究助手。你的任务是帮助研究者理解统计结果、选择研究方法、撰写学术论文。

${context ? `当前上下文：\n${context}\n\n` : ""}
请用中文回答，语言要专业但易懂。如果涉及统计结果，请用通俗语言解释其实际意义。如果用户要求写论文段落，请使用 APA 格式。`;

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: messageText },
      ];

      const response = await callLLM({
        messages: chatMessages,
        temperature: 0.7,
        maxTokens: 2000,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: unknown) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `❌ ${e instanceof Error ? e.message : "调用失败，请检查 API 配置。"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, context, messages]);

  const handleCopy = async (messageId: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
  };

  if (!hasAnyKey()) {
    return (
      <div className={cn("glass-card p-8 text-center", className)}>
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
        <p className="text-sm text-[var(--text-muted)] mb-2">尚未配置 API Key</p>
        <p className="text-xs text-[var(--text-muted)]">请先在设置页面配置 API Key，即可使用 AI 研究助手。</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-[600px]", className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm text-[var(--text-muted)] mb-4">AI 研究助手可以帮助你理解统计结果、推荐方法、撰写论文</p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  className="px-3 py-1.5 rounded-full text-xs border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-colors flex items-center gap-1"
                >
                  <action.icon className="w-3 h-3" /> {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-xl p-3",
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "glass-card"
                )}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] opacity-60">{new Date(msg.timestamp).toLocaleTimeString("zh-CN")}</span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-[10px] opacity-60 hover:opacity-100 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === msg.id ? "已复制" : "复制"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass-card rounded-xl p-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              <span className="text-sm text-[var(--text-muted)]">思考中...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="px-3 h-10 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
            title="清空对话"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="输入问题（如：解释这个 t 检验结果）"
            className="flex-1 h-10 px-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 h-10 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
