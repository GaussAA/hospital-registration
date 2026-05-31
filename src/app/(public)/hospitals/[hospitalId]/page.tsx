import Link from "next/link";
import HospitalInfo from "@/components/hospital/HospitalInfo";
import type { HospitalInfoData } from "@/components/hospital/HospitalInfo";
import DepartmentList from "@/components/department/DepartmentList";
import type { DepartmentCardData } from "@/components/department/DepartmentCard";
import type { PageProps } from "@/types/next";
import type { ApiResponse } from "@/types/api";

export default async function HospitalDetailPage(props: PageProps) {
  const { hospitalId } = await props.params;

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  let hospital: HospitalInfoData | null = null;
  let departments: DepartmentCardData[] = [];

  try {
    const [hospitalRes, deptRes] = await Promise.all([
      fetch(`${apiBase}/api/hospitals/${hospitalId}`, { cache: "no-store" }),
      fetch(`${apiBase}/api/hospitals/${hospitalId}/departments`, { cache: "no-store" }),
    ]);

    const hospitalJson: ApiResponse<HospitalInfoData> = await hospitalRes.json();
    const deptJson: ApiResponse<DepartmentCardData[]> = await deptRes.json();

    if (hospitalJson.data) hospital = hospitalJson.data;
    if (deptJson.data) departments = deptJson.data;
  } catch {
    // Fall through to error state
  }

  if (!hospital) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">医院不存在</h1>
        <Link href="/hospitals" className="text-blue-600 hover:text-blue-700">
          返回医院列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Hospital Info */}
      <HospitalInfo hospital={hospital} />

      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--text-muted)]">
        <Link href="/hospitals" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">医院列表</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text-secondary)]">{hospital.name}</span>
      </nav>

      {/* Departments */}
      <section>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">科室列表</h2>
        <DepartmentList departments={departments} />
      </section>
    </div>
  );
}
