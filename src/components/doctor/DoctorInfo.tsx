import Image from "next/image";

export interface DoctorInfoData {
  id: string;
  name: string;
  title: string;
  specialty: string;
  introduction: string;
  avatarUrl: string;
  hospitalName: string;
  departmentName: string;
}

export default function DoctorInfo({ doctor }: { doctor: DoctorInfoData }) {
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-5 mb-6">
        {/* Avatar */}
        <div className="shrink-0 w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden">
          {doctor.avatarUrl ? (
            <Image src={doctor.avatarUrl} alt={doctor.name} width={80} height={80} className="object-cover" unoptimized />
          ) : (
            <img src="/images/doctor-avatar.svg" alt={doctor.name} width={80} height={80} className="object-cover" />
          )}
        </div>

        {/* Basic info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{doctor.name}</h1>
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-0.5 text-sm font-medium text-blue-700 dark:text-blue-300">
              {doctor.title}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {doctor.hospitalName} · {doctor.departmentName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">专长：</span>
            {doctor.specialty}
          </p>
        </div>
      </div>

      {doctor.introduction && (
        <div className="border-t border-gray-100 dark:border-gray-700/50 pt-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">医生简介</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{doctor.introduction}</p>
        </div>
      )}
    </div>
  );
}
