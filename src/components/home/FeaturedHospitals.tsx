"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface Hospital {
  id: string;
  name: string;
  level: string;
  address: string;
  departmentCount: number;
  doctorCount: number;
  imageUrl: string;
}

// 浮于图片之上的 badge 固定使用浅色样式，图片不随主题变化
const levelBadge: Record<string, string> = {
  三级甲等: "bg-green-100 text-green-700 border border-green-200",
  三级乙等: "bg-blue-100 text-blue-700 border border-blue-200",
  二级甲等: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  二级乙等: "bg-orange-100 text-orange-700 border border-orange-200",
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
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <section className="bg-[var(--bg-muted)]/50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-500/10 px-4 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 mb-4">
              Partners
            </span>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">合作医院</h2>
            <p className="text-[var(--text-secondary)] text-sm">为您推荐优质医疗资源</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </section>
    );
  }

  if (hospitals.length === 0) return null;

  return (
    <section className="bg-[var(--bg-muted)]/50 py-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-500/10 px-4 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 mb-4">
            Partners
          </span>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">合作医院</h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            汇聚全市优质医疗资源，为您提供专业、可靠的医疗服务
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {hospitals.map((hospital, i) => (
            <div
              key={hospital.id}
              className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => router.push(`/hospitals/${hospital.id}`)}
            >
              {/* Image area */}
              <div className="h-44 relative bg-gradient-to-br from-blue-100 dark:from-gray-800 to-indigo-100 dark:to-gray-800 flex items-center justify-center overflow-hidden">
                {hospital.imageUrl ? (
                  <Image
                    src={hospital.imageUrl}
                    alt={hospital.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={i < 3}
                  />
                ) : (
                  <Image
                    src="/images/hospital-placeholder.svg"
                    alt={hospital.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* Level badge on image */}
                <span
                  className={`absolute top-3 right-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${levelBadge[hospital.level] ?? "bg-gray-100 text-gray-800 border border-gray-200"}`}
                >
                  {hospital.level}
                </span>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {hospital.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-1 line-clamp-1">{hospital.address}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {hospital.departmentCount} 个科室 · {hospital.doctorCount} 位医生
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="text-center">
          <button onClick={() => router.push("/hospitals")} className="btn-secondary group">
            <span>查看全部医院</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
