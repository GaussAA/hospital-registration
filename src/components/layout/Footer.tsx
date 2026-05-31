import Link from "next/link";

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
    <footer className="relative mt-auto border-t border-[var(--border-default)]">
      {/* ── Subtle top gradient ── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* ── Main content grid ── */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <span className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                健康挂号
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
              覆盖全市各大医院，在线预约挂号、实时查看医生排班，告别排队等候，轻松就医。
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { label: "微信", icon: "M8.75 2C4.332 2 .75 5.582.75 10c0 2.078.804 3.969 2.117 5.383l-.699 2.117 2.328-.7A7.95 7.95 0 008.75 18c4.418 0 8-3.582 8-8s-3.582-8-8-8z" },
                { label: "微博", icon: "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" },
                { label: "邮箱", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="w-9 h-9 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-blue-500 transition-all hover:scale-110"
                  aria-label={item.label}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
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
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />

        {/* ── Bottom bar ── */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <p>&copy; {new Date().getFullYear()} 健康挂号 - 在线预约挂号平台</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">隐私政策</a>
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">服务条款</a>
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
            <span>客服：010-8888-8888</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
