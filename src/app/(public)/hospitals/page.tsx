import HospitalFilter from "@/components/hospital/HospitalFilter";
import HospitalCard from "@/components/hospital/HospitalCard";
import Pagination from "@/components/hospital/Pagination";
import type { HospitalCardData } from "@/components/hospital/HospitalCard";
import type { PageProps } from "@/types/next";
import { listHospitals } from "@/lib/services/hospital.service";
import Image from "next/image";

interface PageSearchParams {
  city?: string;
  level?: string;
  keyword?: string;
  page?: string;
  pageSize?: string;
}

export default async function HospitalsPage(props: PageProps) {
  const searchParams = await props.searchParams as PageSearchParams;

  const queryPage = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const queryPageSize = 12;

  let hospitals: HospitalCardData[] = [];
  let total = 0;
  let page = queryPage;
  let pageSize = queryPageSize;

  try {
    const result = await listHospitals({
      city: searchParams.city,
      level: searchParams.level,
      keyword: searchParams.keyword,
      page: queryPage,
      pageSize: queryPageSize,
    });
    hospitals = result.list.map((h) => ({
      id: h.id,
      name: h.name,
      level: h.level,
      address: h.address,
      city: h.city,
      imageUrl: h.imageUrl,
    }));
    total = result.total;
    page = result.page;
    pageSize = result.pageSize;
  } catch {
    // If API call fails, render empty state
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">医院列表</h1>

      {/* Filter bar */}
      <div className="mb-6">
        <HospitalFilter />
      </div>

      {/* Hospital grid */}
      {hospitals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {hospitals.map((hospital) => (
              <HospitalCard key={hospital.id} hospital={hospital} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
          />
        </>
      ) : (
        <div className="text-center py-20">
          <Image src="/images/empty-appointment.svg" alt="无结果" className="mx-auto w-32 h-32 mb-6 opacity-60" width={128} height={128} />
          <p className="text-base font-medium text-[var(--text-secondary)]">暂无符合条件的医院</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">请尝试调整筛选条件或搜索关键词</p>
        </div>
      )}
    </div>
  );
}
