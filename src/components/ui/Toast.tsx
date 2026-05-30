"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/* ── Types ── */
interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
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

/* ── Provider ── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast container ── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto rounded-lg px-5 py-3 shadow-lg text-sm font-medium
              animate-[slideIn_0.3s_ease-out]
              ${toast.type === "success" ? "bg-green-600 text-white" : ""}
              ${toast.type === "error" ? "bg-red-600 text-white" : ""}
              ${toast.type === "info" ? "bg-blue-600 text-white" : ""}
            `}
          >
            <div className="flex items-center gap-2">
              <span>
                {toast.type === "success" && "✓"}
                {toast.type === "error" && "✕"}
                {toast.type === "info" && "ℹ"}
              </span>
              <span>{toast.message}</span>
            </div>
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
