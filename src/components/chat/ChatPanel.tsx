"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import ChatMessage from "./ChatMessage";
import { useChatStream } from "@/hooks/useChatStream";
import type { StreamMessage } from "@/lib/ai/types";

/* ── Types ── */

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Constants ── */

const QUICK_ACTIONS = [
  { label: "🏥 查找医院", message: "我想挂号，帮我看看有哪些医院" },
  { label: "📋 我的挂号", message: "查看我的挂号记录" },
  { label: "👤 就诊人管理", message: "查看我的就诊人" },
  { label: "ℹ️ 使用指南", message: "如何使用AI挂号助手？" },
];

/* ── Components ── */

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Welcome greeting
  const welcomeMessage: StreamMessage = {
    role: "assistant",
    content:
      "您好！我是AI挂号助手🤖\n\n我可以帮您:\n• 🏥 **查找医院和科室**\n• 👨‍⚕️ **查看医生排班**\n• 📋 **管理就诊人信息**\n• ✅ **完成在线挂号**\n• 📑 **查询挂号记录**\n\n请告诉我您需要什么帮助？",
    isTyping: false,
    id: "welcome",
  };

  const {
    messages: hookMessages,
    input,
    setInput,
    isLoading,
    conversationId,
    sendMessage,
    stop,
    clearConversation,
  } = useChatStream();

  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Combine welcome message with hook messages
  const allMessages = hookMessages.length === 0
    ? [welcomeMessage]
    : hookMessages;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (msg: string) => {
    setInput("");
    sendMessage(msg);
  };

  /* ── Render ── */

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={() => {
          if (!isExpanded) onClose();
        }}
      />

      {/* Chat Panel */}
      <div
        className={`fixed z-50 flex flex-col transition-all duration-300 ease-out ${
          isExpanded
            ? "inset-4 md:inset-8 rounded-2xl"
            : "bottom-4 right-4 w-[380px] h-[600px] max-h-[80vh] rounded-2xl"
        }`}
        style={{
          background: isDark
            ? "rgba(15,23,42,0.92)"
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: isDark
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(0,0,0,0.08)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 rounded-t-2xl flex-shrink-0"
          style={{
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,0,0,0.06)",
            background: isDark
              ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))"
              : "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
              }}
            >
              🤖
            </div>
            <div>
              <div
                className="font-semibold text-sm"
                style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
              >
                AI 挂号助手
              </div>
              <div
                className="text-xs"
                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              >
                {isLoading ? "正在思考..." : conversationId ? "在线" : "在线"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* New Conversation */}
            <button
              onClick={clearConversation}
              className="p-1.5 rounded-lg transition-colors text-sm"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
              aria-label="新建对话"
              title="新建对话"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {/* Expand / Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg transition-colors text-sm"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
              aria-label={isExpanded ? "缩小" : "全屏"}
            >
              {isExpanded ? "⤡" : "⤢"}
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: isDark ? "#94a3b8" : "#64748b" }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.06)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
              aria-label="关闭"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: isDark
              ? "rgba(255,255,255,0.15) transparent"
              : "rgba(0,0,0,0.15) transparent",
          }}
        >
          {allMessages.map((msg, i) => {
            const isLastMsg = i === allMessages.length - 1;
            const isAssistantLoading =
              isLastMsg && isLoading && msg.role === "assistant";

            return (
              <ChatMessage
                key={msg.id || i}
                role={msg.role as "user" | "assistant"}
                content={msg.content ?? ""}
                isLast={isLastMsg}
                isLoading={
                  isAssistantLoading && msg.content === "" && !msg.isTyping
                }
                isTyping={
                  isLastMsg && msg.role === "assistant" && msg.isTyping
                }
                isExecutingTool={
                  isLastMsg && msg.isExecutingTool === true
                }
                executingToolName={msg.executingToolName}
              />
            );
          })}

          {/* Quick actions (only at start, no messages from user) */}
          {hookMessages.length === 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action.message)}
                  className="px-3 py-1.5 text-xs rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: isDark
                      ? "rgba(99,102,241,0.12)"
                      : "rgba(99,102,241,0.08)",
                    color: isDark ? "#a5b4fc" : "#6366f1",
                    border: isDark
                      ? "1px solid rgba(99,102,241,0.2)"
                      : "1px solid rgba(99,102,241,0.15)",
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div
          className="px-4 py-3 rounded-b-2xl flex-shrink-0"
          style={{
            borderTop: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2 transition-colors"
            style={{
              background: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.03)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的需求..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed max-h-24"
              style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
            />
            {isLoading ? (
              <button
                onClick={stop}
                className="flex-shrink-0 p-2 rounded-lg transition-all duration-200"
                style={{
                  background: isDark
                    ? "rgba(239,68,68,0.2)"
                    : "#ef4444",
                  color: "#fff",
                }}
                aria-label="停止"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 disabled:opacity-40"
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "transparent",
                  color: input.trim()
                    ? "#fff"
                    : isDark
                    ? "#64748b"
                    : "#94a3b8",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            )}
          </div>
          <div
            className="text-[10px] text-center mt-1.5"
            style={{
              color: isDark
                ? "rgba(148,163,184,0.5)"
                : "rgba(100,116,139,0.5)",
            }}
          >
            Enter 发送 · Shift+Enter 换行 {isLoading && "· 点击 ■ 停止"}
          </div>
        </div>
      </div>
    </>
  );
}
