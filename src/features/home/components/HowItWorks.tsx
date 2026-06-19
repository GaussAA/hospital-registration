import { Building2, FlaskConical, User, Check, ArrowDown } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "选择医院",
      description: "浏览入驻平台的所有医院，根据地区、等级筛选心仪的医院",
      icon: <Building2 className="w-8 h-8" />,
    },
    {
      step: "02",
      title: "选择科室",
      description: "查看医院科室详情，了解各科室医生团队和专业擅长",
      icon: <FlaskConical className="w-8 h-8" />,
    },
    {
      step: "03",
      title: "选择医生",
      description: "查看医生排班时间，选择合适的时间段进行预约",
      icon: <User className="w-8 h-8" />,
    },
    {
      step: "04",
      title: "确认挂号",
      description: "填写就诊人信息，确认预约时间和号源，完成挂号",
      icon: <Check className="w-8 h-8" />,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-24">
      {/* Section header */}
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-4">
          How It Works
        </span>
        <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
          挂号流程
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          简单四步，轻松完成在线预约挂号
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        {/* Connecting line (desktop) */}
        <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 dark:from-blue-800 dark:via-blue-500 dark:to-blue-800" />

        {steps.map((item, index) => (
          <div key={item.step} className="relative text-center group">
            {/* Step icon circle */}
            <div className="relative z-10 w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
              {/* Background shimmer */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">{item.icon}</div>
              {/* Step badge */}
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-blue-500 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shadow-sm">
                {item.step}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-2 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {item.description}
            </p>

            {/* Mobile arrow */}
            {index < steps.length - 1 && (
              <div className="md:hidden flex justify-center mt-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
