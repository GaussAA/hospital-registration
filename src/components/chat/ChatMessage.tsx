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

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const accentColor = "#6366f1";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const codeBg = isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)";
  const blockquoteBorder = accentColor;

  /* ── Custom markdown renderers ── */

  const markdownComponents: Components = {
    // Paragraph
    p: ({ children }: { children?: ReactNode }) => (
      <p className="mb-2 last:mb-0 leading-relaxed" style={{ color: textColor }}>
        {children}
      </p>
    ),

    // Headings
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="text-lg font-bold mt-3 mb-1.5 first:mt-0" style={{ color: textColor }}>{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-base font-bold mt-3 mb-1 first:mt-0" style={{ color: textColor }}>{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-[15px] font-semibold mt-2.5 mb-1 first:mt-0" style={{ color: textColor }}>{children}</h3>
    ),

    // Bold / Italic
    strong: ({ children }: { children?: ReactNode }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: ReactNode }) => (
      <em>{children}</em>
    ),

    // Lists
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li className="leading-relaxed" style={{ color: textColor }}>{children}</li>
    ),

    // Inline code
    code: ({ className, children, ...props }: any) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code
            className="px-1 py-0.5 rounded text-[0.85em] font-mono"
            style={{
              background: codeBg,
              color: isDark ? "#a5b4fc" : "#6366f1",
            }}
            {...props}
          >
            {children}
          </code>
        );
      }
      // Code block
      return (
        <pre
          className="my-2 p-3 rounded-xl overflow-x-auto text-sm leading-relaxed font-mono"
          style={{
            background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${borderColor}`,
          }}
        >
          <code className="text-inherit" {...props}>{children}</code>
        </pre>
      );
    },

    // Blockquote
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote
        className="my-2 pl-3 py-1 rounded-r-lg italic"
        style={{
          borderLeft: `3px solid ${blockquoteBorder}`,
          background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
          color: mutedColor,
        }}
      >
        {children}
      </blockquote>
    ),

    // Tables
    table: ({ children }: { children?: ReactNode }) => (
      <div className="my-2 overflow-x-auto rounded-xl" style={{ border: `1px solid ${borderColor}` }}>
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: ReactNode }) => (
      <thead style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>{children}</thead>
    ),
    tbody: ({ children }: { children?: ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children?: ReactNode }) => (
      <tr style={{ borderBottom: `1px solid ${borderColor}` }}>{children}</tr>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th className="px-3 py-2 text-left font-semibold text-xs" style={{ color: textColor, borderRight: `1px solid ${borderColor}` }}>
        {children}
      </th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="px-3 py-2 text-xs" style={{ color: textColor, borderRight: `1px solid ${borderColor}` }}>
        {children}
      </td>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="my-3 border-0" style={{ height: "1px", background: borderColor }} />
    ),

    // Links
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2"
        style={{ color: accentColor }}
      >
        {children}
      </a>
    ),
  };

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
        className="relative max-w-[80%] px-4 py-2.5 rounded-2xl text-sm backdrop-blur-sm transition-colors duration-200 chat-message-content"
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
                color: textColor,
                border: `1px solid ${borderColor}`,
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
        {isLoading && (
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
        )}

        {/* Markdown rendered content */}
        {!isLoading && content && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        )}

        {/* Blinking cursor when typing */}
        {isTyping && content && (
          <span className="inline-block ml-0.5 font-bold animate-pulse" style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}>
            ▊
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
