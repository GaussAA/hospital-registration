import Link from "next/link";
import { DoctorCard } from "@/features/hospital";
import type { DoctorCardData } from "@/features/hospital";
import type { PageProps } from "@/types/next";
import type { ApiResponse } from "@/types/api";

interface DepartmentData {
  id: string;
  name: string;
  description: string;
  hospitalName: string;
  doctorCount: number;
}

export default async function DepartmentDetailPage(props: PageProps) {
  const { hospitalId, departmentId } = await props.params;

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  let department: DepartmentData | null = null;
  let doctors: DoctorCardData[] = [];

  try {
    const [deptRes, doctorRes] = await Promise.all([
      fetch(`${apiBase}/api/hospitals/departments/${departmentId}`, { cache: "no-store" }),
      fetch(`${apiBase}/api/hospitals/departments/${departmentId}/doctors`, { cache: "no-store" }),
    ]);

    const deptJson: ApiResponse<DepartmentData> = await deptRes.json();
    const doctorJson: ApiResponse<DoctorCardData[]> = await doctorRes.json();

    if (deptJson.data) department = deptJson.data;
    if (doctorJson.data) doctors = doctorJson.data;
  } catch {
    // Fall through
  }

  if (!department) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">科室不存在</h1>
        <Link href={`/hospitals/${hospitalId}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          返回医院详情
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--text-muted)]">
        <Link href="/hospitals" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">医院列表</Link>
        <span className="mx-2">/</span>
        <Link href={`/hospitals/${hospitalId}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{department.hospitalName}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text-secondary)]">{department.name}</span>
      </nav>

      {/* Department info */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{department.name}</h1>
        {department.description && (
          <p className="text-sm text-[var(--text-secondary)]">{department.description}</p>
        )}
        <p className="text-sm text-[var(--text-muted)] mt-2">{department.doctorCount} 位医生</p>
      </div>

      {/* Doctor list */}
      {doctors.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-lg">暂无医生信息</p>
        </div>
      )}
    </div>
  );
}
