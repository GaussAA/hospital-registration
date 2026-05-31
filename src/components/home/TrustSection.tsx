const features = [
  {
    title: "官方认证",
    description: "入驻医院均为正规医疗机构，资质齐全",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bgColor: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    hoverBg: "group-hover:bg-blue-600",
  },
  {
    title: "信息保密",
    description: "严格保护您的个人信息和就诊记录，安全可靠",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    hoverBg: "group-hover:bg-emerald-600",
  },
  {
    title: "免费服务",
    description: "平台挂号免费，不收取任何额外费用",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
    hoverBg: "group-hover:bg-violet-600",
  },
  {
    title: "客服支持",
    description: "专业客服团队为您提供7×24小时在线协助",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    bgColor: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hoverBg: "group-hover:bg-amber-600",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-gradient-to-b from-[var(--bg-card)] via-[var(--bg-muted)]/30 to-[var(--bg-page)] py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            为什么选择我们
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            致力于为用户提供安全、便捷、可信赖的在线预约挂号服务
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div key={feature.title} className="text-center group animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${feature.bgColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:text-white ${feature.hoverBg}`}
              >
                {feature.icon}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Contact card */}
        <div className="mt-16 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] p-8 shadow-sm max-w-2xl mx-auto card-hover">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0l-6 6m3 12c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">需要帮助？</h3>
          <p className="text-[var(--text-secondary)] mb-6">
            如果您在预约过程中遇到任何问题，欢迎联系我们的客服团队
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-muted)] px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.054-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="text-sm text-[var(--text-muted)]">电话</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">010-8888-8888</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-muted)] px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="text-sm text-[var(--text-muted)]">邮箱</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">support@health-reg.com</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-muted)] px-4 py-2.5">
              <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-[var(--text-muted)]">服务</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">7×24 小时</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
