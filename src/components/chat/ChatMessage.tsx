"use client";

import { useTheme } from "@/components/ui/ThemeProvider";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/* ── Types ── */

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  messageId?: string;
  isLast?: boolean;
  isLoading?: boolean;
  isTyping?: boolean;
  isExecutingTool?: boolean;
  executingToolName?: string;
}

/* ── Tool name labels ── */

const TOOL_LABELS: Record<string, string> = {
  search_hospitals: "搜索医院",
  search_departments: "查询科室",
  search_doctors: "查询医生",
  get_doctor_schedules: "查看排班",
  get_hospital_detail: "查看医院详情",
  get_doctor_detail: "查看医生详情",
  recommend_department: "推荐科室",
  get_registration_guide: "获取就诊指南",
  analyze_image: "分析图片",
  get_patient_profiles: "获取就诊人信息",
  create_patient_profile: "添加就诊人",
  create_registration: "创建挂号",
  list_registrations: "查询挂号记录",
  cancel_registration: "取消挂号",
};

function getToolLabel(name: string): string {
  return TOOL_LABELS[name] || name;
}

/* ── Component ── */

export default function ChatMessage({
  role,
  content,
  messageId,
  isLast,
  isLoading,
  isTyping,
  isExecutingTool,
  executingToolName,
}: ChatMessageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const msgRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<"helpful" | "not_helpful" | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);

  // Auto scroll into view for new messages
  useEffect(() => {
    if (isLast && msgRef.current) {
      msgRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isLast, content]);

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const userBubbleBg = isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleFeedback = async (rating: "helpful" | "not_helpful") => {
    if (!messageId || feedbackSent) return;
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating }),
      });
      const data = await res.json();
      if (data.code === 0) {
        setFeedbackSent(rating);
        setFeedbackError(false);
      } else {
        setFeedbackError(true);
        setTimeout(() => setFeedbackError(false), 3000);
      }
    } catch {
      setFeedbackError(true);
      setTimeout(() => setFeedbackError(false), 3000);
    }
  };

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
    code: ({ className, children, ...props }: ComponentPropsWithoutRef<"code">) => {
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
        <div className="max-w-[90%] min-w-0">
          {/* Tool execution indicator */}
          {isExecutingTool && executingToolName && (
            <div
              className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg animate-fade-in"
              style={{
                background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)",
                border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)"}`,
              }}
            >
              {/* Spinning icon */}
              <svg
                className="animate-spin flex-shrink-0"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-medium" style={{ color: isDark ? "#a5b4fc" : "#6366f1" }}>
                {getToolLabel(executingToolName)}…
              </span>
            </div>
          )}

          {isLoading && !isExecutingTool ? (
            <div className="flex items-center gap-1.5 py-2" style={{ color: mutedColor }}>
              <span className="block w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: "0ms", background: mutedColor }} />
              <span className="block w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: "150ms", background: mutedColor }} />
              <span className="block w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: "300ms", background: mutedColor }} />
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
              {/* Copy + Feedback buttons for assistant messages with content */}
              {!isTyping && content && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
                    style={{
                      color: mutedColor,
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
                    title="复制消息"
                  >
                    {copied ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        已复制
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        复制
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleFeedback("helpful")}
                    disabled={feedbackSent !== null}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-50"
                    style={{
                      color: feedbackSent === "helpful" ? "#22c55e" : mutedColor,
                      background: feedbackSent === "helpful"
                        ? "rgba(34,197,94,0.1)"
                        : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    }}
                    onMouseOver={(e) => {
                      if (!feedbackSent)
                        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
                    }}
                    onMouseOut={(e) => {
                      if (!feedbackSent)
                        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
                    }}
                    title="有帮助"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={feedbackSent === "helpful" ? "#22c55e" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    {feedbackSent === "helpful" && <span style={{ color: "#22c55e" }}>已赞</span>}
                  </button>
                  <button
                    onClick={() => handleFeedback("not_helpful")}
                    disabled={feedbackSent !== null}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-50"
                    style={{
                      color: feedbackSent === "not_helpful" ? "#ef4444" : mutedColor,
                      background: feedbackSent === "not_helpful"
                        ? "rgba(239,68,68,0.1)"
                        : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    }}
                    onMouseOver={(e) => {
                      if (!feedbackSent)
                        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
                    }}
                    onMouseOut={(e) => {
                      if (!feedbackSent)
                        e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
                    }}
                    title="没有帮助"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={feedbackSent === "not_helpful" ? "#ef4444" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z" />
                      <line x1="17" y1="2" x2="22" y2="2" />
                    </svg>
                    {feedbackSent === "not_helpful" && <span style={{ color: "#ef4444" }}>已踩</span>}
                  </button>
                  {/* 反馈错误提示 */}
                  {feedbackError && (
                    <span className="text-[10px]" style={{ color: "#ef4444" }}>
                      反馈失败
                    </span>
                  )}
                </div>
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
        className="max-w-[85%] px-4 py-2 rounded-2xl rounded-tr-md text-[15px] leading-relaxed relative group"
        style={{
          background: userBubbleBg,
          color: textColor,
        }}
      >
        {content}
        {/* Copy button on hover */}
        <button
          onClick={handleCopy}
          className="absolute -top-1 -right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: isDark ? "rgba(30,30,40,0.9)" : "rgba(255,255,255,0.9)",
            color: mutedColor,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
          title="复制"
        >
          {copied ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
