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
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{department.description}</p>
      )}
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{department.doctorCount} 位医生</p>
      <Link
        href={`/hospitals/${department.hospitalId}/departments/${department.id}`}
        className="inline-flex w-full items-center justify-center rounded-lg border border-blue-600 dark:border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      >
        查看医生
      </Link>
    </div>
  );
}
