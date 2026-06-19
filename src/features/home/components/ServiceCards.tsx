"use client";

import { useRouter } from "next/navigation";
import { Calendar, Building2, Users, ClipboardCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/index";

const services = [
  {
    title: "预约挂号",
    description: "在线预约专家门诊，选择合适的时间段，告别排队等候",
    icon: <Calendar className="w-7 h-7" />,
    path: "/hospitals",
    gradient: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 dark:bg-blue-500/10",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "医院导航",
    description: "浏览全市各大医院信息，查看地址、等级、科室分布",
    icon: <Building2 className="w-7 h-7" />,
    path: "/hospitals",
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "专家团队",
    description: "查看医生详细介绍、专业擅长、出诊时间安排",
    icon: <Users className="w-7 h-7" />,
    path: "/hospitals",
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-500/10",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "我的挂号",
    description: "查看已预约记录，管理就诊行程，支持在线取消",
    icon: <ClipboardCheck className="w-7 h-7" />,
    path: "/appointments",
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
  },
];

export default function ServiceCards() {
  const router = useRouter();

  return (
    <section id="services" className="max-w-7xl mx-auto px-4 py-24">
      {/* Section header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-4">
          Quick Access
        </span>
        <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          快速服务
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          一站式在线医疗服务平台，为您提供便捷的就医体验
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((service, i) => (
          <Card
            key={service.title}
            onClick={() => router.push(service.path)}
            className="group relative cursor-pointer animate-slide-up border-border bg-card overflow-hidden"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/50 to-white/0 dark:from-white/5 dark:to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardContent className="relative p-6 rounded-2xl transition-all duration-300 group-hover:-translate-y-2">
              {/* Icon */}
              <div
                className={`w-13 h-13 rounded-2xl ${service.bgLight} ${service.textColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <div className="relative">
                  {service.icon}
                  {/* Subtle icon glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300`} />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>

              {/* Arrow indicator */}
              <div className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${service.textColor} opacity-0 group-hover:opacity-100 transition-all duration-300`}>
                <span>立即使用</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
