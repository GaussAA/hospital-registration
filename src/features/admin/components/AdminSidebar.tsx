"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Building2, Stethoscope, User, CalendarDays, Menu, X, ArrowLeft, Plus } from "lucide-react";

const menuItems = [
  {
    label: "仪表盘",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "医院管理",
    href: "/admin/hospitals",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    label: "科室管理",
    href: "/admin/departments",
    icon: <Stethoscope className="w-5 h-5" />,
  },
  {
    label: "医生管理",
    href: "/admin/doctors",
    icon: <User className="w-5 h-5" />,
  },
  {
    label: "排班管理",
    href: "/admin/schedules",
    icon: <CalendarDays className="w-5 h-5" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const close = () => setIsOpen(false);

  return (
    <>
      {/* ─── Mobile hamburger ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all"
        aria-label={isOpen ? "关闭菜单" : "打开菜单"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ─── Mobile overlay ─── */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex flex-col min-h-screen
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
        `}
      >
        {/* Decorative top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        {/* Logo */}
        <div className="relative flex items-center justify-center h-16 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">管理后台</span>
          </div>
          {/* Bottom subtle border */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                )}
                <span className={`${active ? "" : "group-hover:scale-110"} transition-transform duration-200`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative p-4 shrink-0">
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2 py-2 text-sm text-slate-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>返回前台</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
