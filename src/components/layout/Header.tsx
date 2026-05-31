"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useUser } from "@/components/auth/UserProvider";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position for glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const showSolid = !isHome || scrolled;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        showSolid
          ? "bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          : "bg-transparent"
      }`}
    >
      {/* Animated bottom border line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[1px] transition-opacity duration-300 ${
          showSolid
            ? "opacity-100 bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-700/50 to-transparent"
            : "opacity-0"
        }`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* ── Left: Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {/* Logo icon */}
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
            </svg>
          </div>
          {/* Logo text */}
          <span className={`text-lg font-bold tracking-tight transition-colors ${
            showSolid
              ? "text-gray-900 dark:text-gray-100"
              : "text-white"
          }`}>
            健康挂号
          </span>
        </Link>

        {/* ── Center: Navigation + Search ── */}
        <div className="hidden md:flex items-center gap-1 flex-1 mx-6">
          {/* Nav links */}
          <nav className="flex items-center gap-1 mr-4">
            {[
              { href: "/", label: "首页" },
              { href: "/hospitals", label: "医院" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === item.href
                    ? showSolid
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "bg-white/15 text-white"
                    : showSolid
                      ? "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search - inline */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.elements.namedItem("keyword") as HTMLInputElement;
              if (input?.value.trim()) {
                router.push(`/hospitals?keyword=${encodeURIComponent(input.value.trim())}`);
              }
            }}
            className="flex-1 max-w-sm"
          >
            <div className="relative">
              <svg
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  showSolid ? "text-gray-400" : "text-white/50"
                }`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                name="keyword"
                placeholder="搜索医院..."
                className={`w-full rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition-all placeholder:text-gray-400 ${
                  showSolid
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/30 border border-transparent focus:border-blue-500"
                    : "bg-white/10 text-white placeholder:text-white/50 border border-white/10 focus:bg-white/15 focus:border-white/20"
                }`}
              />
            </div>
          </form>
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />

          {user ? (
            <>
              {/* Mobile search toggle (not implemented, just icon) */}
              <Link
                href="/appointments"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  showSolid
                    ? "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="hidden lg:inline">我的挂号</span>
              </Link>

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showSolid
                      ? "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  管理
                </Link>
              )}

              {/* User avatar + logout */}
              <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-gray-200 dark:border-gray-700">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  showSolid
                    ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                    : "bg-white/20 text-white"
                }`}>
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/auth/logout", { method: "POST" });
                    if (res.ok) {
                      window.location.href = "/hospitals";
                    }
                  }}
                  className={`hidden sm:inline text-xs font-medium transition-colors ${
                    showSolid
                      ? "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  退出
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  showSolid
                    ? "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                登录
              </Link>
              <Link
                href="/register"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                  showSolid
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-blue-500/20"
                    : "bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25"
                }`}
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
