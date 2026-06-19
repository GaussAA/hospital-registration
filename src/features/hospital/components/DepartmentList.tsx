import DepartmentCard from "./DepartmentCard";
import type { DepartmentCardData } from "./DepartmentCard";

export default function DepartmentList({ departments }: { departments: DepartmentCardData[] }) {
  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted-foreground)]">
        <p className="text-lg">暂无科室信息</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((dept) => (
        <DepartmentCard key={dept.id} department={dept} />
      ))}
    </div>
  );
}
