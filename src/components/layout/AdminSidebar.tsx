"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { label: "仪表盘", href: "/admin", icon: "📊" },
  { label: "医院管理", href: "/admin/hospitals", icon: "🏥" },
  { label: "科室管理", href: "/admin/departments", icon: "🩺" },
  { label: "医生管理", href: "/admin/doctors", icon: "👨‍⚕️" },
  { label: "排班管理", href: "/admin/schedules", icon: "📅" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const close = () => setIsOpen(false);

  return (
    <>
      {/* ─── 移动端汉堡按钮 ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
        aria-label={isOpen ? "关闭菜单" : "打开菜单"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* ─── 移动端遮罩 ─── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 dark:bg-black/80"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ─── 侧边栏 ─── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900 text-white flex flex-col min-h-screen
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700 shrink-0">
          <span className="text-xl font-bold tracking-wide">管理后台</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 dark:text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 shrink-0">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-white transition-colors"
          >
            <span>←</span>
            <span>返回前台</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
