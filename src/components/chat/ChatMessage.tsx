"use client";

import { useTheme } from "@/components/ui/ThemeProvider";
import { useEffect, useRef } from "react";

/* ── Types ── */

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLast?: boolean;
  isLoading?: boolean;
  isTyping?: boolean;
  isExecutingTool?: boolean;
  executingToolName?: string;
}

/* ── Utility: format message content with simple markdown-like formatting ── */

function formatMessage(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Line breaks
    .replace(/\n/g, "<br/>");
}

/* ── Component ── */

export default function ChatMessage({
  role,
  content,
  isLast,
  isLoading,
  isTyping,
  isExecutingTool,
  executingToolName,
}: ChatMessageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const msgRef = useRef<HTMLDivElement>(null);

  // Auto scroll into view for new messages
  useEffect(() => {
    if (isLast && msgRef.current) {
      msgRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isLast, content]);

  return (
    <div
      ref={msgRef}
      className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}
    >
      {/* Avatar (assistant only) */}
      {role === "assistant" && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 shadow-sm"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(59,130,246,0.8), rgba(139,92,246,0.8))"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            fontSize: "14px",
          }}
        >
          AI
        </div>
      )}

      {/* Message bubble */}
      <div
        className="relative max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed backdrop-blur-sm transition-colors duration-200"
        style={
          role === "user"
            ? {
                background: isDark
                  ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
              }
            : {
                background: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                color: isDark ? "#e2e8f0" : "#1e293b",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(0,0,0,0.06)",
              }
        }
      >
        {/* Tool execution status */}
        {isExecutingTool && (
          <div
            className="mb-2 px-2 py-1 rounded-lg text-xs flex items-center gap-1.5"
            style={{
              background: isDark
                ? "rgba(99,102,241,0.15)"
                : "rgba(99,102,241,0.08)",
              color: isDark ? "#a5b4fc" : "#6366f1",
            }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
            🔍 正在查询{executingToolName || "信息"}...
          </div>
        )}

        {/* Loading dots */}
        {isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span
              className="block w-2 h-2 rounded-full animate-bounce"
              style={{ background: isDark ? "#94a3b8" : "#64748b", animationDelay: "0ms" }}
            />
            <span
              className="block w-2 h-2 rounded-full animate-bounce"
              style={{ background: isDark ? "#94a3b8" : "#64748b", animationDelay: "150ms" }}
            />
            <span
              className="block w-2 h-2 rounded-full animate-bounce"
              style={{ background: isDark ? "#94a3b8" : "#64748b", animationDelay: "300ms" }}
            />
          </div>
        ) : (
          <span>
            <span dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
            {/* Blinking cursor when typing */}
            {isTyping && content && (
              <span className="inline-block ml-0.5 font-bold animate-pulse" style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}>
                ▊
              </span>
            )}
          </span>
        )}
      </div>

      {/* Avatar (user) */}
      {role === "user" && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ml-2 shadow-sm"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(249,115,22,0.8), rgba(239,68,68,0.8))"
              : "linear-gradient(135deg, #f97316, #ef4444)",
            color: "#fff",
            fontSize: "14px",
          }}
        >
          我
        </div>
      )}
    </div>
  );
}
