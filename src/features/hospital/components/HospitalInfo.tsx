import Image from "next/image";
import hospitalPlaceholder from "@/shared/assets/hospital-placeholder.svg";

export interface HospitalInfoData {
  id: string;
  name: string;
  address: string;
  city: string;
  level: string;
  phone: string;
  description: string;
  imageUrl: string;
  departmentCount: number;
  doctorCount: number;
}

export default function HospitalInfo({ hospital }: { hospital: HospitalInfoData }) {
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Banner */}
      {hospital.imageUrl ? (
        <div className="h-48 relative overflow-hidden">
          <Image
            src={hospital.imageUrl}
            alt={hospital.name}
            fill
            className="object-cover opacity-80"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      ) : (
        <div className="h-48 relative bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-800 dark:to-blue-900 flex items-center justify-center overflow-hidden">
          <Image
            src={hospitalPlaceholder}
            alt={hospital.name}
            fill
            className="object-cover opacity-80"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{hospital.name}</h1>
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300">
              {hospital.level}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-gray-100">地址：</span>
            {hospital.address}
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-gray-100">电话：</span>
            {hospital.phone}
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-gray-100">科室：</span>
            {hospital.departmentCount} 个
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-gray-100">医生：</span>
            {hospital.doctorCount} 位
          </div>
        </div>

        {hospital.description && (
          <div className="border-t border-gray-100 dark:border-gray-700/50 pt-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">医院简介</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{hospital.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
