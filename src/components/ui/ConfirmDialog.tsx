"use client";

import { useEffect, useCallback, useRef, type ReactNode } from "react";

/* ── Types ── */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/* ── Variant styles ── */
const variantStyles = {
  danger: {
    icon: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    confirmBg: "bg-red-600 hover:bg-red-700 focus:ring-red-500/40",
    borderColor: "border-red-200 dark:border-red-900/50",
  },
  warning: {
    icon: (
      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    confirmBg: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/40",
    borderColor: "border-amber-200 dark:border-amber-900/50",
  },
  info: {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
    confirmBg: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/40",
    borderColor: "border-blue-200 dark:border-blue-900/50",
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确定",
  cancelLabel = "取消",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];

  // Focus trap: auto-focus confirm button on open
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // ESC key to cancel
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
      }
    },
    [onCancel, loading],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={loading ? undefined : onCancel}
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-[#1e293b] shadow-2xl border ${styles.borderColor} animate-[scaleIn_0.15s_ease-out]`}
        onKeyDown={handleKeyDown}
      >
        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirm-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h3>
              <div className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                {message}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 ${styles.confirmBg}`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? "处理中..." : confirmLabel}
          </button>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
