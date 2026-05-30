export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "选择医院",
      description: "浏览入驻平台的所有医院，根据地区、等级筛选心仪的医院",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      step: "02",
      title: "选择科室",
      description: "查看医院科室详情，了解各科室医生团队和专业擅长",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      step: "03",
      title: "选择医生",
      description: "查看医生排班时间，选择合适的时间段进行预约",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      step: "04",
      title: "确认挂号",
      description: "填写就诊人信息，确认预约时间和号源，完成挂号",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">挂号流程</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          简单四步，轻松完成在线预约挂号
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        {/* 连接线（桌面端） */}
        <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />

        {steps.map((item, index) => (
          <div key={item.step} className="relative text-center group">
            {/* 步骤编号（圆形） */}
            <div className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
              {item.icon}
              {/* 步骤号角标 */}
              <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-[#1e293b] border-2 border-blue-500 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shadow-sm">
                {item.step}
              </span>
            </div>

            {/* 标题 */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>

            {/* 描述 */}
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">{item.description}</p>

            {/* 底部装饰箭头（非最后一项） */}
            {index < steps.length - 1 && (
              <div className="md:hidden flex justify-center mt-4">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
