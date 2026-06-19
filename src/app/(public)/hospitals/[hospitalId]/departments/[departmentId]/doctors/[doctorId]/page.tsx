import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { DoctorInfo } from "@/features/hospital";
import type { DoctorInfoData } from "@/features/hospital";
import { getDoctorById, listSchedulesByDoctor } from "@/features/hospital/queries";
import type { PageProps } from "@/shared/types/next";
import ScheduleCalendarWrapper from "./ScheduleCalendarWrapper";

export const dynamic = "force-dynamic";

export default async function DoctorDetailPage(props: PageProps) {
  noStore();
  const { hospitalId, departmentId, doctorId } = await props.params;

  let doctor: DoctorInfoData | null = null;
  let schedules: Awaited<ReturnType<typeof listSchedulesByDoctor>> = [];

  try {
    const [doctorData, scheduleData] = await Promise.all([
      getDoctorById(doctorId),
      listSchedulesByDoctor(doctorId),
    ]);
    doctor = {
      id: doctorData.id,
      name: doctorData.name,
      title: doctorData.title,
      specialty: doctorData.specialty,
      introduction: doctorData.introduction,
      avatarUrl: doctorData.avatarUrl,
      hospitalName: doctorData.hospitalName,
      departmentName: doctorData.departmentName,
    };
    schedules = scheduleData;
  } catch {
    // Fall through to error state
  }

  if (!doctor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">医生不存在</h1>
        <Link href="/hospitals" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400">
        <Link href="/hospitals" className="hover:text-blue-600 transition-colors">医院列表</Link>
        <span className="mx-2">/</span>
        <Link href={`/hospitals/${hospitalId}`} className="hover:text-blue-600 transition-colors">{doctor.hospitalName}</Link>
        <span className="mx-2">/</span>
        <Link href={`/hospitals/${hospitalId}/departments/${departmentId}`} className="hover:text-blue-600 transition-colors">{doctor.departmentName}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{doctor.name}</span>
      </nav>

      {/* Doctor info */}
      <DoctorInfo doctor={doctor} />

      {/* Schedule + Inline Booking */}
      <ScheduleCalendarWrapper
        schedules={schedules}
        doctorId={doctor.id}
        hospitalId={hospitalId}
        departmentId={departmentId}
        doctorName={doctor.name}
        doctorTitle={doctor.title}
        departmentName={doctor.departmentName}
        hospitalName={doctor.hospitalName}
      />
    </div>
  );
}
