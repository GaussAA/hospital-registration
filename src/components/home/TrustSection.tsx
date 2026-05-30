const features = [
  {
    title: "官方认证",
    description: "入驻医院均为正规医疗机构，资质齐全",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "信息保密",
    description: "严格保护您的个人信息和就诊记录，安全可靠",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "免费服务",
    description: "平台挂号免费，不收取任何额外费用",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "客服支持",
    description: "专业客服团队为您提供7×24小时在线协助",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function TrustSection() {
  return (
    <section className="bg-gradient-to-b from-white dark:from-gray-900 to-blue-50 dark:to-gray-800 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">为什么选择我们</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            致力于为用户提供安全、便捷、可信赖的在线预约挂号服务
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center group">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:scale-110 group-hover:shadow-lg">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* 客服信息 */}
        <div className="mt-16 text-center bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-700/50 p-8 shadow-sm dark:shadow-none max-w-2xl mx-auto">
          <div className="text-2xl mb-2">📞</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">需要帮助？</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            如果您在预约过程中遇到任何问题，欢迎联系我们的客服团队
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-sm">
              <span className="text-gray-400 dark:text-gray-500">客服电话：</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">010-8888-8888</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400 dark:text-gray-500">客服邮箱：</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">support@health-reg.com</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400 dark:text-gray-500">服务时间：</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">7×24 小时</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
