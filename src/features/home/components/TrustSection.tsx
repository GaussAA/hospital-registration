import { Shield, Lock, DollarSign, Headphones, Phone, Mail, Clock } from "lucide-react";

const features = [
  {
    title: "官方认证",
    description: "入驻医院均为正规医疗机构，资质齐全",
    icon: <Shield className="w-7 h-7" />,
    bgColor: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    hoverBg: "group-hover:bg-blue-600",
  },
  {
    title: "信息保密",
    description: "严格保护您的个人信息和就诊记录，安全可靠",
    icon: <Lock className="w-7 h-7" />,
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    hoverBg: "group-hover:bg-emerald-600",
  },
  {
    title: "免费服务",
    description: "平台挂号免费，不收取任何额外费用",
    icon: <DollarSign className="w-7 h-7" />,
    bgColor: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
    hoverBg: "group-hover:bg-violet-600",
  },
  {
    title: "客服支持",
    description: "专业客服团队为您提供7×24小时在线协助",
    icon: <Headphones className="w-7 h-7" />,
    bgColor: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    hoverBg: "group-hover:bg-amber-600",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-gradient-to-b from-card via-muted/30 to-background py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            为什么选择我们
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
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
              <h3 className="font-semibold text-foreground mb-1.5">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Contact card */}
        <div className="mt-16 text-center bg-card rounded-2xl border-border p-8 shadow-sm max-w-2xl mx-auto card-hover">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 mb-4">
            <Phone className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">需要帮助？</h3>
          <p className="text-muted-foreground mb-6">
            如果您在预约过程中遇到任何问题，欢迎联系我们的客服团队
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">电话</span>
              <span className="text-sm font-semibold text-foreground">010-8888-8888</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">邮箱</span>
              <span className="text-sm font-semibold text-foreground">support@health-reg.com</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">服务</span>
              <span className="text-sm font-semibold text-foreground">7×24 小时</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
