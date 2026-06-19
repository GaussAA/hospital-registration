"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  /* Scroll lock — Dialog 自带 backdrop，但额外确保滚动锁定 */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${maxWidth} rounded-2xl border-border/80 p-0 gap-0 shadow-2xl`}
        onEscapeKeyDown={onClose}
        onInteractOutside={onClose}
      >
        <DialogHeader className="px-6 py-4 border-b border-border/60">
          <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">{children}</div>
        {/* 替换 Dialog 默认关闭按钮为 lucide X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
