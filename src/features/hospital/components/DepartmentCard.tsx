import Link from "next/link";
import { Card } from "@/shared/ui";

export interface DepartmentCardData {
  id: string;
  name: string;
  description: string;
  doctorCount: number;
  hospitalId: string;
}

export default function DepartmentCard({ department }: { department: DepartmentCardData }) {
  return (
    <Card className="p-5 rounded-xl shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-foreground mb-1">{department.name}</h3>
      {department.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{department.description}</p>
      )}
      {department.doctorCount > 0 ? (
        <p className="text-sm text-muted-foreground mb-4">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-xs font-semibold text-blue-600 dark:text-blue-400 mr-1">
            {department.doctorCount}
          </span>
          {department.doctorCount} 位医生
        </p>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">暂无医生</p>
      )}
      <Link
        href={`/hospitals/${department.hospitalId}/departments/${department.id}`}
        className="inline-flex w-full items-center justify-center rounded-lg border border-blue-600 dark:border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      >
        查看医生
      </Link>
    </Card>
  );
}
