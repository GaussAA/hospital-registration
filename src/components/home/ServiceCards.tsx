"use client";

import { useRouter } from "next/navigation";

const services = [
  {
    title: "预约挂号",
    description: "在线预约专家门诊，选择合适的时间段，告别排队等候",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    path: "/hospitals",
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "医院导航",
    description: "浏览全市各大医院信息，查看地址、等级、科室分布",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    path: "/hospitals",
    color: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-900/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "专家团队",
    description: "查看医生详细介绍、专业擅长、出诊时间安排",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    path: "/hospitals",
    color: "from-violet-500 to-violet-600",
    bgLight: "bg-violet-50 dark:bg-violet-900/30",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "我的挂号",
    description: "查看已预约记录，管理就诊行程，支持在线取消",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    path: "/appointments",
    color: "from-amber-500 to-amber-600",
    bgLight: "bg-amber-50 dark:bg-amber-900/30",
    textColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function ServiceCards() {
  const router = useRouter();

  return (
    <section id="services" className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">快速服务</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          一站式在线医疗服务平台，为您提供便捷的就医体验
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service) => (
          <button
            key={service.title}
            onClick={() => router.push(service.path)}
            className="group relative text-left"
          >
            {/* 毛玻璃卡片 */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/50 to-white/0 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 shadow-sm dark:shadow-none hover:shadow-xl transition-all hover:-translate-y-2">
              {/* 图标 */}
              <div className={`w-14 h-14 rounded-2xl ${service.bgLight} ${service.textColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>

              {/* 标题 */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{service.title}</h3>

              {/* 描述 */}
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{service.description}</p>

              {/* 箭头指示 */}
              <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${service.textColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                <span>立即使用</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
