"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { TOAST_DURATION_MS } from "@/lib/constants";

/* ── Types ── */
interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  closing: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

/* ── Context ── */
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Styles ── */
const typeStyles = {
  success:
    "bg-[var(--color-success)] text-white",
  error:
    "bg-[var(--color-danger)] text-white",
  info:
    "bg-[var(--color-primary)] text-white",
};

const typeIcons = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

/* ── Provider ── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    // Start close animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t)),
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message, closing: false }]);
      setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast container ── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`
              pointer-events-auto rounded-lg px-4 py-3 shadow-lg text-sm font-medium
              flex items-center gap-2.5 cursor-pointer select-none
              transition-all duration-200
              ${toast.closing ? "opacity-0 translate-x-8 scale-95" : "opacity-100"}
              animate-[slideIn_0.25s_ease-out]
              ${typeStyles[toast.type]}
            `}
            role="alert"
          >
            {/* Icon */}
            <span className="shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {typeIcons[toast.type]}
            </span>

            {/* Message */}
            <span className="flex-1">{toast.message}</span>

            {/* Close button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-xs"
              aria-label="关闭通知"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ── Keyframes ── */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
