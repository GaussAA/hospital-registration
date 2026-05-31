import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 illustration */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          {/* Medical cross outline */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-300 dark:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
              </svg>
            </div>
          </div>
          {/* 404 floating label */}
          <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-center">
            <span className="text-lg font-bold text-red-500 dark:text-red-400">404</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          页面未找到
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">
          您访问的页面不存在或已被移除，<br />
          请检查链接是否正确
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-sm"
          >
            返回首页
          </Link>
          <Link
            href="/hospitals"
            className="rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            浏览医院
          </Link>
        </div>
      </div>
    </div>
  );
}
