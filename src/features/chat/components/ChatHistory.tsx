"use client";

import { useMemo, useState } from "react";
import { useTheme } from "@/shared/ui/ThemeProvider";
import type { ConversationSummary } from "../types";

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ChatHistory({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSwitch,
  onNew,
  onDelete,
}: ChatHistoryProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const activeBg = isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)";

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) => c.title.toLowerCase().includes(q)
    );
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.25)" }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 w-[320px] flex flex-col animate-slide-up"
        style={{
          background: isDark
            ? "rgba(20,20,28,0.98)"
            : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderRight: `1px solid ${borderColor}`,
          boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <h2 className="text-sm font-semibold" style={{ color: textColor }}>
            对话历史
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNew}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
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
            <button
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: mutedColor }}
              onMouseOver={(e) => (e.currentTarget.style.background = hoverBg)}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
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
              placeholder="搜索对话..."
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: textColor }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-0.5 rounded"
                style={{ color: mutedColor }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5" style={{ scrollbarWidth: "thin" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={mutedColor} strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="text-xs" style={{ color: mutedColor }}>
                {searchQuery ? "未找到匹配的对话" : "暂无对话记录"}
              </p>
              {!searchQuery && (
                <button
                  onClick={onNew}
                  className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    color: "#6366f1",
                    background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
                  }}
                >
                  开始新对话
                </button>
              )}
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isConfirming = confirmDelete === conv.id;

              return (
                <div
                  key={conv.id}
                  className="group relative rounded-lg transition-all duration-150"
                  style={{
                    background: isActive ? activeBg : "transparent",
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.background = hoverBg;
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {isConfirming ? (
                    /* Delete confirmation */
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <span className="text-xs" style={{ color: "#ef4444" }}>
                        确认删除？
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={async () => {
                            await onDelete(conv.id);
                            setConfirmDelete(null);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-medium text-white"
                          style={{ background: "#ef4444" }}
                        >
                          删除
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-0.5 rounded text-[11px]"
                          style={{
                            color: textColor,
                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => onSwitch(conv.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSwitch(conv.id);
                        }
                      }}
                    >
                      {/* Icon */}
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke={isActive ? "#6366f1" : mutedColor}
                        strokeWidth="2" className="flex-shrink-0"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs truncate"
                          style={{
                            color: isActive ? "#6366f1" : textColor,
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {conv.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px]" style={{ color: mutedColor }}>
                            {conv.messageCount} 条消息
                          </span>
                          <span className="text-[10px]" style={{ color: mutedColor }}>
                            ·
                          </span>
                          <span className="text-[10px]" style={{ color: mutedColor }}>
                            {formatTime(conv.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete button (visible on hover) */}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all cursor-pointer flex items-center"
                        style={{ color: mutedColor }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseOut={(e) => (e.currentTarget.style.color = mutedColor)}
                        title="删除对话"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            setConfirmDelete(conv.id);
                          }
                        }}
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

        {/* Footer */}
        <div
          className="px-4 py-2.5 flex-shrink-0 text-center"
          style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <span className="text-[10px]" style={{ color: mutedColor }}>
            共 {conversations.length} 个对话
          </span>
        </div>
      </div>
    </>
  );
}
