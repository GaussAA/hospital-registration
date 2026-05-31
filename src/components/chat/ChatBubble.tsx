"use client";

import { useState } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import ChatPanel from "./ChatPanel";

/* ── Component ── */

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <>
      {/* Chat Panel */}
      {isOpen && <ChatPanel isOpen={isOpen} onClose={close} />}

      {/* Floating Trigger Button — hidden when panel is open */}
      <div
        className={`fixed bottom-6 right-6 z-[9999] transition-all duration-200 ${
          isOpen ? "opacity-0 pointer-events-none scale-75" : "opacity-100 scale-100"
        }`}
      >
        {/* Notification dot */}
        {!isOpen && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10 animate-pulse"
            style={{ background: "#ef4444" }}
          >
            1
          </span>
        )}

        <button
          onClick={open}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
          }}
          aria-label="打开AI挂号助手"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          </svg>
        </button>

        {/* Glow effect ring — pointer-events-none so it doesn't block clicks */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}
        />

        {/* Label tooltip — pointer-events-none so it doesn't block clicks */}
        <div
          className="absolute -top-12 right-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none select-none"
          style={{
            background: isDark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.95)",
            color: isDark ? "#e2e8f0" : "#1e293b",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
          }}
        >
          🤖 AI挂号助手
          <div
            className="absolute -bottom-1 right-5 w-2 h-2 rotate-45 pointer-events-none"
            style={{
              background: isDark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.95)",
              borderRight: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
            }}
          />
        </div>
      </div>
    </>
  );
}
