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
const typeConfig = {
  success: {
    bg: "bg-gradient-to-r from-green-500 to-emerald-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: "bg-gradient-to-r from-red-500 to-rose-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
};

/* ── Provider ── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
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
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => {
          const config = typeConfig[toast.type];
          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className={`
                pointer-events-auto rounded-xl px-4 py-3 text-white text-sm font-medium
                flex items-center gap-2.5 cursor-pointer select-none
                shadow-lg shadow-black/10
                transition-all duration-200
                ${
                  toast.closing
                    ? "animate-toast-out"
                    : "animate-toast-in"
                }
                ${config.bg}
              `}
              role="alert"
            >
              {/* Icon */}
              <span className="shrink-0 w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                {config.icon}
              </span>

              {/* Message */}
              <span className="flex-1">{toast.message}</span>

              {/* Close */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors text-xs"
                aria-label="关闭通知"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
