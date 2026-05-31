"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState, startTransition } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 等待 hydration 完成后才渲染主题相关 UI，消除服务端/客户端不一致
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={mounted ? (theme === "light" ? "切换深色模式" : "切换浅色模式") : "切换深色模式"}
      title={mounted ? (theme === "light" ? "深色模式" : "浅色模式") : "深色模式"}
    >
      {/* Sun icon (shown in dark mode, indicating switch to light) — 默认 hidden，mounted 后才展示主题对应图标 */}
      <svg
        className={`w-5 h-5 absolute transition-all duration-300 ${
          !mounted
            ? "opacity-0"
            : theme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-75"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon icon (shown in light mode, indicating switch to dark) — 默认 hidden */}
      <svg
        className={`w-5 h-5 absolute transition-all duration-300 ${
          !mounted
            ? "opacity-0"
            : theme === "light"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-75"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
