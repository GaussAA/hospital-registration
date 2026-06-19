"use client";

import { useState } from "react";
import { useTheme } from "@/shared/ui/ThemeProvider";
import ChatPanel from "./ChatPanel";
import { MessageCircle } from "lucide-react";

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

      {/* Floating Trigger Button */}
      <div
        className={`fixed bottom-6 right-6 z-[9999] transition-all duration-300 ${
          isOpen
            ? "opacity-0 pointer-events-none scale-75"
            : "opacity-100 scale-100"
        }`}
      >
        {/* Notification dot */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center text-[10px] font-bold text-white z-10 animate-pulse">
            1
          </span>
        )}

        <button
          onClick={open}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
          }}
          aria-label="打开AI挂号助手"
        >
          <MessageCircle size={24} color="white" />
        </button>

        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}
        />

        {/* Tooltip */}
        <div
          className={`absolute -top-12 right-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg pointer-events-none select-none ${
            isDark ? "bg-slate-800/95 text-slate-200 border border-white/10" : "bg-white/95 text-slate-800 border border-black/5"
          }`}
        >
          <span className="mr-1">🤖</span>
          AI 挂号助手
          <div
            className={`absolute -bottom-1 right-5 w-2 h-2 rotate-45 pointer-events-none ${
              isDark ? "bg-slate-800/95 border-r border-b border-white/10" : "bg-white/95 border-r border-b border-black/5"
            }`}
          />
        </div>
      </div>
    </>
  );
}
