import Link from "next/link";
import Image from "next/image";

export interface DoctorCardData {
  id: string;
  name: string;
  title: string;
  specialty: string;
  avatarUrl: string;
  hospitalId: string;
  departmentId: string;
}

export default function DoctorCard({ doctor }: { doctor: DoctorCardData }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-5 shadow-sm dark:shadow-none hover:shadow-md transition-shadow flex items-start gap-4">
      {/* Avatar */}
      <div className="shrink-0 w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
        {doctor.avatarUrl ? (
          <Image src={doctor.avatarUrl} alt={doctor.name} width={64} height={64} className="object-cover" />
        ) : (
          <Image src="/images/doctor-avatar.svg" alt={doctor.name} width={64} height={64} className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{doctor.name}</h3>
          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            {doctor.title}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">专长：{doctor.specialty}</p>
        <div className="mt-3">
          <Link
            href={`/hospitals/${doctor.hospitalId}/departments/${doctor.departmentId}/doctors/${doctor.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            预约挂号
          </Link>
        </div>
      </div>
    </div>
  );
}
