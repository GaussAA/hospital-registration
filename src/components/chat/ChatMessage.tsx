"use client";

import { useTheme } from "@/components/ui/ThemeProvider";
import { useEffect, useRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

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

/* ── Component ── */

export default function ChatMessage({
  role,
  content,
  isLast,
  isLoading,
  isTyping,
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

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const userBubbleBg = isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)";

  /* ── Custom markdown renderers ── */

  const markdownComponents: Components = {
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>
    ),
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="text-lg font-bold mt-3 mb-1.5">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-base font-bold mt-2.5 mb-1">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-[15px] font-semibold mt-2 mb-1">{children}</h3>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
    code: ({ className, children, ...props }: any) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code
            className="px-1 py-0.5 rounded text-[0.9em] font-mono"
            style={{
              background: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
              color: isDark ? "#a5b4fc" : "#6366f1",
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <pre
          className="my-2 p-2.5 rounded-lg overflow-x-auto text-sm leading-relaxed font-mono"
          style={{
            background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
          }}
        >
          <code className="text-inherit" {...props}>{children}</code>
        </pre>
      );
    },
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote
        className="my-2 pl-3 py-0.5 rounded-r border-l-2 italic opacity-90"
        style={{ borderLeftColor: "#6366f1" }}
      >
        {children}
      </blockquote>
    ),
  };

  // AI message: plain text on background, left-aligned, no bubble
  if (role === "assistant") {
    return (
      <div ref={msgRef} className="flex justify-start mb-4 animate-fade-in">
        <div className="max-w-[90%]">
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-2" style={{ color: mutedColor }}>
              <span className="block w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="block w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="block w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div style={{ color: textColor }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {content}
              </ReactMarkdown>
              {isTyping && (
                <span className="inline-block ml-0.5 font-bold animate-pulse" style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}>
                  ▊
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User message: right-aligned bubble
  return (
    <div ref={msgRef} className="flex justify-end mb-4 animate-fade-in">
      <div
        className="max-w-[85%] px-4 py-2 rounded-2xl rounded-tr-md text-[15px] leading-relaxed"
        style={{
          background: userBubbleBg,
          color: textColor,
        }}
      >
        {content}
      </div>
    </div>
  );
}
