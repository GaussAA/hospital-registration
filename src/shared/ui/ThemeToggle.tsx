"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState, startTransition } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-accent active:scale-95"
      aria-label={mounted ? (theme === "light" ? "切换深色模式" : "切换浅色模式") : "切换深色模式"}
      title={mounted ? (theme === "light" ? "深色模式" : "浅色模式") : "深色模式"}
    >
      {/* Sun icon - shown in dark mode */}
      <Sun
        className={`w-5 h-5 absolute transition-all duration-500 ease-out ${
          !mounted
            ? "opacity-0"
            : theme === "dark"
              ? "opacity-100 rotate-0 scale-100 text-amber-400"
              : "opacity-0 rotate-90 scale-75 text-muted-foreground"
        }`}
      />

      {/* Moon icon - shown in light mode */}
      <Moon
        className={`w-5 h-5 absolute transition-all duration-500 ease-out ${
          !mounted
            ? "opacity-0"
            : theme === "light"
              ? "opacity-100 rotate-0 scale-100 text-foreground"
              : "opacity-0 -rotate-90 scale-75 text-slate-400"
        }`}
      />
    </button>
  );
}
