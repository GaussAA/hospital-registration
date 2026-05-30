"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * ConfirmPage — redirects to the doctor detail page where the inline
 * booking flow now lives. Direct access is redirected.
 */
export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get("scheduleId") ?? "";

  useEffect(() => {
    // Try to go back to the doctor detail page
    if (scheduleId) {
      router.back();
    } else {
      router.push("/hospitals");
    }
  }, [router, scheduleId]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-500 text-sm">正在跳转...</p>
    </div>
  );
}
