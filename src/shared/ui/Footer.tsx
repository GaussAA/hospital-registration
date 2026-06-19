import Link from "next/link";
import { Plus, Mail } from "lucide-react";

const footerLinks = [
  {
    title: "快速链接",
    links: [
      { label: "首页", href: "/" },
      { label: "医院列表", href: "/hospitals" },
      { label: "我的挂号", href: "/appointments" },
    ],
  },
  {
    title: "帮助支持",
    links: [
      { label: "挂号指南", href: "#" },
      { label: "常见问题", href: "#" },
      { label: "隐私政策", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border">
      {/* ── Subtle top gradient ── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Main content grid ── */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">健康挂号</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              覆盖全市各大医院，在线预约挂号、实时查看医生排班，告别排队等候，轻松就医。
            </p>

            {/* Social icons — 微信/微博保留自定义 SVG，邮箱用 lucide Mail */}
            <div className="flex items-center gap-3 pt-2">
              {/* 微信 */}
              <button
                type="button"
                className="w-9 h-9 rounded-xl bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-blue-500 transition-all hover:scale-110"
                aria-label="微信"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.75 2C4.332 2 .75 5.582.75 10c0 2.078.804 3.969 2.117 5.383l-.699 2.117 2.328-.7A7.95 7.95 0 008.75 18c4.418 0 8-3.582 8-8s-3.582-8-8-8z"
                  />
                </svg>
              </button>

              {/* 微博 */}
              <button
                type="button"
                className="w-9 h-9 rounded-xl bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-blue-500 transition-all hover:scale-110"
                aria-label="微博"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                  />
                </svg>
              </button>

              {/* 邮箱 — 替换为 lucide */}
              <button
                type="button"
                className="w-9 h-9 rounded-xl bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-blue-500 transition-all hover:scale-110"
                aria-label="邮箱"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Bottom bar ── */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 健康挂号 - 在线预约挂号平台</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              隐私政策
            </a>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <a href="#" className="hover:text-foreground transition-colors">
              服务条款
            </a>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>客服：010-8888-8888</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
