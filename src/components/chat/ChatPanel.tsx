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
  { label: "查找医院", desc: "搜索医院和科室信息", message: "我想挂号，帮我看看有哪些医院" },
  { label: "症状推荐", desc: "描述症状，推荐科室", message: "我发烧咳嗽，应该挂什么科" },
  { label: "就诊指南", desc: "就诊前准备事项", message: "就诊前需要准备什么" },
  { label: "我的挂号", desc: "查看挂号记录", message: "查看我的挂号记录" },
];

/* ── Components ── */

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState(false);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Welcome greeting
  const welcomeMessage: StreamMessage = {
    role: "assistant",
    content: "",
    isTyping: false,
    id: "welcome",
  };

  // Combine welcome message with hook messages
  const allMessages = hookMessages.length === 0 ? [welcomeMessage] : hookMessages;

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

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";

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

      {/* Chat Panel — Notion-inspired design */}
      <div
        className={`fixed z-50 flex flex-col transition-all duration-300 ease-out ${
          isExpanded
            ? "inset-4 md:inset-8 rounded-2xl"
            : "bottom-4 right-4 w-[400px] h-[640px] max-h-[85vh] rounded-xl"
        }`}
        style={{
          background: isDark
            ? "rgba(23,23,30,0.98)"
            : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? "0 16px 48px rgba(0,0,0,0.5)"
            : "0 16px 48px rgba(0,0,0,0.15)",
        }}
      >
        {/* ── Minimal Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0 select-none"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span className="font-semibold text-sm" style={{ color: textColor }}>
              AI 挂号助手
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {/* History */}
            <button
              onClick={() => {}}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: mutedColor }}
              onMouseOver={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              title="历史对话"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            {/* Expand */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: mutedColor }}
              onMouseOver={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              title={isExpanded ? "缩小" : "全屏"}
            >
              {isExpanded ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: mutedColor }}
              onMouseOver={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              title="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div
          className="flex-1 overflow-y-auto scroll-smooth"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: isDark ? "rgba(255,255,255,0.1) transparent" : "rgba(0,0,0,0.1) transparent",
          }}
        >
          {allMessages.length === 1 && allMessages[0].id === "welcome" && !isLoading ? (
            /* ── Welcome State (Notion-style) ── */
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 pt-12 pb-4">
              {/* Mascot */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))"
                    : "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))",
                }}
              >
                🩺
              </div>

              {/* Greeting */}
              <h2 className="text-lg font-semibold mb-1" style={{ color: textColor }}>
                随时待命，有什么可以帮您？
              </h2>
              <p className="text-xs mb-6" style={{ color: mutedColor }}>
                通过对话完成挂号全流程，快捷又方便
              </p>

              {/* Quick actions as cards */}
              <div className="w-full space-y-2 max-w-xs">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.message)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.03)",
                      border: `1px solid ${borderColor}`,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
                  >
                    <span className="text-lg flex-shrink-0">
                      {["🔍", "🩺", "📋", "📑"][i]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: textColor }}>
                        {action.label}
                      </div>
                      <div className="text-xs truncate" style={{ color: mutedColor }}>
                        {action.desc}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={mutedColor} strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Chat History ── */
            <div className="px-4 py-4 space-y-1">
              {allMessages.map((msg, i) => {
                const isLastMsg = i === allMessages.length - 1;
                const isAssistantLoading = isLastMsg && isLoading && msg.role === "assistant";

                return (
                  <ChatMessage
                    key={msg.id || i}
                    role={msg.role as "user" | "assistant"}
                    content={msg.content ?? ""}
                    isLast={isLastMsg}
                    isLoading={isAssistantLoading && msg.content === "" && !msg.isTyping}
                    isTyping={isLastMsg && msg.role === "assistant" && msg.isTyping === true}
                    isExecutingTool={isLastMsg && msg.isExecutingTool === true}
                    executingToolName={msg.executingToolName}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input Area — Two-layer Notion-style ── */}
        <div className="px-3 pb-3 pt-1.5 flex-shrink-0">
          {/* Layer 1: Text input with controls */}
          <div
            className="flex items-end rounded-t-xl px-3 py-2.5 transition-colors"
            style={{
              background: inputBg,
              border: `1px solid ${borderColor}`,
              borderBottom: "none",
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
          >
            {/* Text area — full width, no extra accessories inside */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的需求..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed max-h-24"
              style={{ color: textColor }}
            />

            {/* Send / Stop button */}
            <div className="flex-shrink-0 ml-2">
              {isLoading ? (
                <button
                  onClick={stop}
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                  title="停止生成"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 rounded-lg transition-all duration-200 disabled:opacity-30"
                  style={{
                    background: input.trim()
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "transparent",
                    color: input.trim() ? "#fff" : mutedColor,
                  }}
                  title="发送"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polyline points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Layer 2: Action buttons row */}
          <div
            className="flex items-center justify-between px-3 py-1.5 rounded-b-xl transition-colors"
            style={{
              background: inputBg,
              border: `1px solid ${borderColor}`,
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }}
          >
            <div className="flex items-center gap-1">
              {/* Auto label */}
              <div
                className="px-2 py-0.5 rounded text-[11px] font-medium select-none"
                style={{
                  background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
                  color: isDark ? "#a5b4fc" : "#6366f1",
                }}
              >
                Auto
              </div>
              <span className="text-[11px] select-none" style={{ color: mutedColor }}>
                {isLoading ? "正在回复..." : "就绪"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] select-none" style={{ color: isDark ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.4)" }}>
                Enter 发送 · Shift+Enter 换行
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
