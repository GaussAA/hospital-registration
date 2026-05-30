import HospitalFilter from "@/components/hospital/HospitalFilter";
import HospitalCard from "@/components/hospital/HospitalCard";
import Pagination from "@/components/hospital/Pagination";
import type { HospitalCardData } from "@/components/hospital/HospitalCard";
import type { PageProps } from "@/types/next";
import type { ApiResponse, PaginatedData } from "@/types/api";

interface PageSearchParams {
  city?: string;
  level?: string;
  keyword?: string;
  page?: string;
  pageSize?: string;
}

export default async function HospitalsPage(props: PageProps) {
  const searchParams = await props.searchParams as PageSearchParams;

  const params = new URLSearchParams();
  if (searchParams.city) params.set("city", searchParams.city);
  if (searchParams.level) params.set("level", searchParams.level);
  if (searchParams.keyword) params.set("keyword", searchParams.keyword);
  if (searchParams.page) params.set("page", searchParams.page);
  params.set("pageSize", "12");

  let hospitals: HospitalCardData[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 12;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}/api/hospitals?${params.toString()}`,
      { cache: "no-store" }
    );
    const json: ApiResponse<PaginatedData<HospitalCardData>> = await res.json();
    if (json.data) {
      hospitals = json.data.list;
      total = json.data.total;
      page = json.data.page;
      pageSize = json.data.pageSize;
    }
  } catch {
    // If API call fails, render empty state
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">医院列表</h1>

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
            pageSize={pageSize}
            total={total}
            searchParams={params.toString()}
          />
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">暂无符合条件的医院</p>
          <p className="text-sm mt-1">请尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
}
