"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Hospital {
  id: string;
  name: string;
  level: string;
  address: string;
  departmentCount: number;
  doctorCount: number;
  imageUrl: string;
}

const levelBadge: Record<string, string> = {
  "三级甲等": "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
  "三级乙等": "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
  "二级甲等": "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
  "二级乙等": "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300",
};

export default function FeaturedHospitals() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/hospitals?pageSize=6")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.list) {
          setHospitals(json.data.list);
        }
      })
      .catch(() => {
        // 静默失败
      })
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <section className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">合作医院</h2>
            <p className="text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      </section>
    );
  }

  if (hospitals.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-800 py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">合作医院</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            汇聚全市优质医疗资源，为您提供专业、可靠的医疗服务
          </p>
        </div>

        {/* 医院卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="group bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm dark:shadow-none hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => router.push(`/hospitals/${hospital.id}`)}
            >
              {/* 医院图片占位 */}
              <div className="h-40 bg-gradient-to-br from-blue-100 dark:from-gray-800 to-indigo-100 dark:to-gray-800 flex items-center justify-center overflow-hidden">
                {hospital.imageUrl ? (
                  <img
                    src={hospital.imageUrl}
                    alt={hospital.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/images/hospital-placeholder.svg"
                    alt={hospital.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* 文字信息 */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{hospital.name}</h3>
                  <span className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${levelBadge[hospital.level] ?? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}>
                    {hospital.level}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">{hospital.address}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {hospital.departmentCount} 个科室 · {hospital.doctorCount} 位医生
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 查看全部 */}
        <div className="text-center">
          <button
            onClick={() => router.push("/hospitals")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] px-8 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm dark:shadow-none"
          >
            查看全部医院
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
