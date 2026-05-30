import Link from "next/link";

export interface HospitalCardData {
  id: string;
  name: string;
  level: string;
  address: string;
  departmentCount: number;
  doctorCount: number;
}

export default function HospitalCard({ hospital }: { hospital: HospitalCardData }) {
  const levelColors: Record<string, string> = {
    "三级甲等": "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
    "三级乙等": "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
    "二级甲等": "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
    "二级乙等": "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300",
    "一级甲等": "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    "一级乙等": "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
  };

  const badgeColor = levelColors[hospital.level] ?? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-5 shadow-sm dark:shadow-none hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{hospital.name}</h3>
        <span className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
          {hospital.level}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">{hospital.address}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
        {hospital.departmentCount} 个科室 · {hospital.doctorCount} 位医生
      </p>
      <div className="mt-auto">
        <Link
          href={`/hospitals/${hospital.id}`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-blue-600 dark:border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
        >
          查看详情
        </Link>
      </div>
    </div>
  );
}
