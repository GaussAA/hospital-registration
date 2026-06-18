"use client";

import { ToastProvider } from "./Toast";

export default function AdminToastWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
