import Link from "next/link";

export interface DepartmentCardData {
  id: string;
  name: string;
  description: string;
  doctorCount: number;
  hospitalId: string;
}

export default function DepartmentCard({ department }: { department: DepartmentCardData }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-5 shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{department.name}</h3>
      {department.description && (
        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{department.description}</p>
      )}
      {department.doctorCount > 0 ? (
        <p className="text-sm text-[var(--text-muted)] mb-4">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400 mr-1">
            {department.doctorCount}
          </span>
          {department.doctorCount} 位医生
        </p>
      ) : (
        <p className="text-sm text-[var(--text-muted)] mb-4">暂无医生</p>
      )}
      <Link
        href={`/hospitals/${department.hospitalId}/departments/${department.id}`}
        className="inline-flex w-full items-center justify-center rounded-lg border border-blue-600 dark:border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      >
        查看医生
      </Link>
    </div>
  );
}
