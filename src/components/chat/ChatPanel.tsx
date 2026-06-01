"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import ChatMessage from "./ChatMessage";
import { useChatStream } from "@/hooks/useChatStream";
import { useUser } from "@/components/auth/UserProvider";
import type { StreamMessage, ConversationSummary } from "@/lib/ai/types";

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

const welcomeMessage: StreamMessage = {
  role: "assistant",
  content: "",
  isTyping: false,
  id: "welcome",
};

/* ── History Dropdown (integrated in-panel) ── */

function HistoryDropdown({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSwitch,
  onNew,
  onDelete,
  isDark,
  textColor,
  mutedColor,
  borderColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the trigger click
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins}分钟前`;
    if (hrs < 24) return `${hrs}小时前`;
    if (days < 7) return `${days}天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  if (!isOpen) return null;

  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const activeBg = isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)";

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 z-50 overflow-hidden animate-scale-in"
      style={{
        top: "100%",
        marginTop: "2px",
        background: isDark
          ? "rgba(23,23,30,0.98)"
          : "rgba(255,255,255,0.98)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        boxShadow: isDark
          ? "0 12px 32px rgba(0,0,0,0.6)"
          : "0 12px 32px rgba(0,0,0,0.15)",
        maxHeight: "360px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            color: mutedColor,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索历史对话..."
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: textColor }}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5 rounded" style={{ color: mutedColor }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5" style={{ scrollbarWidth: "thin" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs" style={{ color: mutedColor }}>
              {searchQuery ? "未找到匹配的对话" : "暂无对话记录"}
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isConfirming = confirmDelete === conv.id;

            return (
              <div
                key={conv.id}
                className="group relative rounded-lg transition-all duration-150"
                style={{ background: isActive ? activeBg : "transparent" }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = hoverBg; }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {isConfirming ? (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-xs" style={{ color: "#ef4444" }}>确认删除？</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={async () => { await onDelete(conv.id); setConfirmDelete(null); }}
                        className="px-2 py-0.5 rounded text-[11px] font-medium text-white"
                        style={{ background: "#ef4444" }}
                      >
                        删除
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-0.5 rounded text-[11px]"
                        style={{ color: textColor, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => { onSwitch(conv.id); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSwitch(conv.id); onClose(); } }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#6366f1" : mutedColor} strokeWidth="2" className="flex-shrink-0">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate" style={{ color: isActive ? "#6366f1" : textColor, fontWeight: isActive ? 500 : 400 }}>
                        {conv.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: mutedColor }}>{conv.messageCount} 条消息</span>
                        <span className="text-[10px]" style={{ color: mutedColor }}>·</span>
                        <span className="text-[10px]" style={{ color: mutedColor }}>{formatTime(conv.updatedAt)}</span>
                      </div>
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(conv.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer flex items-center flex-shrink-0"
                      style={{ color: mutedColor }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseOut={(e) => (e.currentTarget.style.color = mutedColor)}
                      title="删除对话"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setConfirmDelete(conv.id); } }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New conversation footer */}
      <div className="px-3 pb-3 pt-1 flex-shrink-0">
        <button
          onClick={() => { onNew(); onClose(); }}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新对话
        </button>
      </div>
    </div>
  );
}

/* ── Main Panel ── */

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { theme } = useTheme();
  const { user } = useUser();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    setInput,
    isLoading,
    conversationId,
    conversations,
    sendMessage,
    stop,
    newConversation,
    switchConversation,
    deleteConversation,
  } = useChatStream({ userId: user?.id });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const allMessages = useMemo(
    () => (messages.length === 0 ? [welcomeMessage] : messages),
    [messages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showHistory) setShowHistory(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, showHistory]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if ((!text && !pendingImage) || isLoading) return;
    let finalMessage = text;
    if (pendingImage) {
      finalMessage = text
        ? `[图片已上传: ${pendingImage}] ${text}`
        : `[图片已上传: ${pendingImage}] 请帮我分析这张图片`;
      setPendingImage(null);
    }
    setInput("");
    sendMessage(finalMessage);
  }, [input, pendingImage, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleQuickAction = (msg: string) => {
    setInput("");
    sendMessage(msg);
  };

  /** Export current conversation as Markdown file via API */
  const handleExport = useCallback(async () => {
    if (!conversationId || messages.length === 0) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/export`);
      if (!res.ok) throw new Error("导出失败");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
      const fileName = match ? decodeURIComponent(match[1]) : `对话记录_${conversationId.slice(-6)}.md`;

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Silently handle error
    }
  }, [conversationId, messages.length]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.code === 0 && data.data?.url) setPendingImage(data.data.url);
    } catch (err) { console.error("[upload] error:", err); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }, []);

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const currentConversation = conversations.find((c) => c.id === conversationId);
  const headerTitle = currentConversation?.title || "AI 挂号助手";

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={() => { if (!isExpanded) onClose(); }}
      />

      {/* Chat Panel */}
      <div
        className={`fixed z-50 flex flex-col transition-all duration-300 ease-out animate-scale-in ${
          isExpanded
            ? "inset-4 md:inset-8 rounded-2xl"
            : "bottom-4 right-4 w-[400px] h-[640px] max-h-[85vh] rounded-xl"
        }`}
        style={{
          background: isDark ? "rgba(23,23,30,0.98)" : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(0,0,0,0.15)",
        }}
      >
        {/* ── Header with integrated history dropdown ── */}
        <div
          className="relative flex items-center justify-between px-4 py-3 flex-shrink-0 select-none"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          {/* Left: clickable title — opens history dropdown */}
          <div
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 min-w-0 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowHistory(!showHistory); } }}
          >
            <span className="text-base flex-shrink-0">✨</span>
            <span className="font-semibold text-sm truncate" style={{ color: textColor }}>
              {headerTitle}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={mutedColor} strokeWidth="2"
              className="transition-transform duration-200 flex-shrink-0"
              style={{ transform: showHistory ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {conversations.length > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full mr-1"
                style={{
                  background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
                  color: isDark ? "#a5b4fc" : "#6366f1",
                }}
              >
                {conversations.length}
              </span>
            )}
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
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
            <button
              onClick={handleExport}
              disabled={!conversationId || messages.length === 0}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: mutedColor }}
              onMouseOver={(e) => { if (conversationId && messages.length > 0) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"; }}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              title="导出对话"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: mutedColor }}
              onMouseOver={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              title="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Integrated history dropdown */}
          <HistoryDropdown
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            conversations={conversations}
            activeConversationId={conversationId}
            onSwitch={switchConversation}
            onNew={newConversation}
            onDelete={deleteConversation}
            isDark={isDark}
            textColor={textColor}
            mutedColor={mutedColor}
            borderColor={borderColor}
          />
        </div>

        {/* ── Messages Area ── */}
        <div
          className="flex-1 overflow-y-auto scroll-smooth relative"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: isDark ? "rgba(255,255,255,0.1) transparent" : "rgba(0,0,0,0.1) transparent",
          }}
        >
          {allMessages.length === 1 && allMessages[0].id === "welcome" && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-6 pt-12 pb-20">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))"
                    : "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))",
                }}
              >
                🩺
              </div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: textColor }}>
                随时待命，有什么可以帮您？
              </h2>
              <p className="text-xs mb-6" style={{ color: mutedColor }}>
                通过对话完成挂号全流程，快捷又方便
              </p>
              <div className="w-full space-y-2 max-w-xs">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.message)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${borderColor}`,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
                  >
                    <span className="text-lg flex-shrink-0">{["🔍", "🩺", "📋", "📑"][i]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: textColor }}>{action.label}</div>
                      <div className="text-xs truncate" style={{ color: mutedColor }}>{action.desc}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={mutedColor} strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {allMessages.length > 0 && allMessages[0].id !== "welcome" && (
            <div className="px-4 py-4 pb-20 space-y-1">
              {allMessages.map((msg, i) => {
                const isLastMsg = i === allMessages.length - 1;
                const isAssistantLoading = isLastMsg && isLoading && msg.role === "assistant";
                return (
                  <ChatMessage
                    key={msg.id || i}
                    role={msg.role as "user" | "assistant"}
                    content={msg.content ?? ""}
                    messageId={msg.messageId}
                    isLast={isLastMsg}
                    isLoading={isAssistantLoading && msg.content === "" && !msg.isTyping && !msg.isExecutingTool && !msg.isThinking}
                    isTyping={isLastMsg && msg.role === "assistant" && msg.isTyping === true}
                    isExecutingTool={isLastMsg && msg.isExecutingTool === true}
                    executingToolName={msg.executingToolName}
                    toolCallNames={msg.toolCallNames}
                    isThinking={isLastMsg && msg.isThinking === true}
                    thinkingContent={msg.thinkingContent}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {allMessages.length > 0 && !isLoading && (() => {
            const lastMsg = allMessages[allMessages.length - 1];
            if (lastMsg.role === "assistant" && (lastMsg.content?.startsWith("网络错误") || lastMsg.content?.startsWith("请求出错"))) {
              return (
                <div className="flex justify-center px-4 pb-2">
                  <button
                    onClick={() => {
                      const prevUserMsg = [...allMessages].reverse().find((m) => m.role === "user");
                      if (prevUserMsg) sendMessage(prevUserMsg.content);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95"
                    style={{ background: "#ef4444", color: "#fff" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    重试
                  </button>
                </div>
              );
            }
            return null;
          })()}

          {/* ── Floating Input Area ── */}
          <div className="sticky bottom-0 left-0 right-0 px-3 pb-3 pt-0 pointer-events-none">
            <div
              className="pointer-events-auto rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/30 backdrop-blur-xl transition-all duration-300"
              style={{
                background: isDark ? "rgba(23,23,30,0.92)" : "rgba(255,255,255,0.92)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />

              {pendingImage && (
                <div className="relative px-4 pt-3 pb-0">
                  <div className="relative inline-block rounded-lg overflow-hidden border"
                    style={{ borderColor, maxWidth: "180px", maxHeight: "120px" }}
                  >
                    <img src={pendingImage} alt="待发送图片" className="w-full h-full object-cover" style={{ maxHeight: "100px" }} />
                    <button
                      onClick={() => setPendingImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        background: isDark ? "rgba(30,30,40,0.9)" : "rgba(255,255,255,0.9)",
                        color: mutedColor,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                      title="移除图片"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: mutedColor }}>图片已就绪，发送后将触发 AI 分析</div>
                </div>
              )}

              <div className="px-4 pt-3 pb-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    const el = e.target;
                    el.style.height = "auto";
                    const lineHeight = 23;
                    const maxHeight = lineHeight * 4;
                    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入您的需求..."
                  className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed"
                  style={{ color: textColor, minHeight: "23px", maxHeight: "92px" }}
                />
              </div>

              <div className="flex items-center px-4 pb-2.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <div
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold select-none"
                    style={{
                      background: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
                      color: isDark ? "#a5b4fc" : "#6366f1",
                    }}
                  >
                    Auto
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading}
                    className="p-1.5 rounded-md transition-colors disabled:opacity-30"
                    style={{
                      color: pendingImage ? "#6366f1" : mutedColor,
                      background: pendingImage ? (isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)") : "transparent",
                    }}
                    onMouseOver={(e) => { if (!pendingImage) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
                    onMouseOut={(e) => { if (!pendingImage) e.currentTarget.style.background = "transparent"; }}
                    title={isUploading ? "上传中..." : "上传图片"}
                  >
                    {isUploading ? (
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </button>
                  {isLoading && (
                    <span className="text-[10px] select-none flex items-center gap-1" style={{ color: mutedColor }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      回复中
                    </span>
                  )}
                </div>

                <div
                  className="flex-1 text-center text-[9px] select-none"
                  style={{ color: isDark ? "rgba(148,163,184,0.3)" : "rgba(100,116,139,0.3)" }}
                >
                  Enter 发送 · Shift+Enter 换行
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {isLoading ? (
                    <button
                      onClick={stop}
                      className="p-1.5 rounded-xl transition-all duration-200 flex items-center gap-1"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                      title="停止生成"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      <span className="text-[10px] font-medium">停止</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() && !pendingImage}
                      className="p-2 rounded-xl transition-all duration-200 disabled:opacity-30 hover:scale-105 active:scale-95"
                      style={{
                        background: input.trim() || pendingImage
                          ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                          : "transparent",
                        color: input.trim() || pendingImage ? "#fff" : mutedColor,
                        boxShadow: input.trim() || pendingImage ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
