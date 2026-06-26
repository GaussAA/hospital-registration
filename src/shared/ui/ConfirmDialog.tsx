"use client";

import { TriangleAlert, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { ReactNode } from "react";

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

const variantIcons = {
  danger: TriangleAlert,
  warning: TriangleAlert,
  info: CircleAlert,
};

const variantColors = {
  danger: "text-red-600 dark:text-red-400" as const,
  warning: "text-amber-600 dark:text-amber-400" as const,
  info: "text-blue-600 dark:text-blue-400" as const,
};

export function ConfirmDialog({
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
  const Icon = variantIcons[variant];
  const iconColor = variantColors[variant];

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !loading && onCancel()}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogContent className="max-w-md rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm leading-relaxed">
                {message}
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={loading}>
                {cancelLabel}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant={variant === "danger" ? "destructive" : "default"}
                onClick={onConfirm}
                disabled={loading}
                className="min-w-[80px]"
              >
                {loading && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                {loading ? "处理中..." : confirmLabel}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
}

export default ConfirmDialog;
