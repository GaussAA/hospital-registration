import Link from "next/link";

export interface HospitalCardData {
  id: string;
  name: string;
  level: string;
  address: string;
  departmentCount: number;
  doctorCount: number;
}

const levelBadge: Record<string, string> = {
  "三级甲等": "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/30",
  "三级乙等": "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30",
  "二级甲等": "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/30",
  "二级乙等": "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30",
  "一级甲等": "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  "一级乙等": "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
};

export default function HospitalCard({ hospital }: { hospital: HospitalCardData }) {
  const badge = levelBadge[hospital.level] ?? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";

  return (
    <div className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {hospital.name}
        </h3>
        <span className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}>
          {hospital.level}
        </span>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-sm text-[var(--text-secondary)] mb-1">
        <svg className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <span className="line-clamp-1">{hospital.address}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mb-4 mt-2">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          {hospital.departmentCount} 个科室
        </span>
        <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          {hospital.doctorCount} 位医生
        </span>
      </div>

      {/* Action */}
      <div className="mt-auto">
        <Link
          href={`/hospitals/${hospital.id}`}
          className="group/btn inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 px-4 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 hover:border-blue-600 transition-all duration-200"
        >
          <span>查看详情</span>
          <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
