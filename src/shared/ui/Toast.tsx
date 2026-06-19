"use client";

import { toast as sonnerToast } from "sonner";
import { CheckCircle, XCircle, Info } from "lucide-react";

/**
 * 兼容层：将旧版 showToast API 映射到 sonner toast
 *
 * 使用方式（不变）：
 *   showToast("操作成功", "success")
 *   showToast("出错了", "error")
 *   showToast("提示信息", "info")
 */
export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const iconMap = {
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  sonnerToast[type](message, {
    icon: iconMap[type],
    duration: 3000,
  });
}

/**
 * useToast hook — 保持与旧代码兼容
 */
export function useToast() {
  return { showToast };
}

export { Toaster } from "@/components/ui/sonner";
