import Link from "next/link";

interface AdminHeaderProps {
  title: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        >
          返回前台
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-medium">
            A
          </span>
          <span className="hidden sm:inline">管理员</span>
        </div>
      </div>
    </header>
  );
}
