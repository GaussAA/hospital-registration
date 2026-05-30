"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "重庆", "西安"];
const LEVELS = ["三级甲等", "三级乙等", "二级甲等", "二级乙等", "一级甲等", "一级乙等"];

export default function HospitalFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCity = searchParams.get("city") ?? "";
  const currentLevel = searchParams.get("level") ?? "";
  const currentKeyword = searchParams.get("keyword") ?? "";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/hospitals?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* City filter */}
      <select
        value={currentCity}
        onChange={(e) => updateParams("city", e.target.value)}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">全部城市</option>
        {CITIES.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      {/* Level filter */}
      <select
        value={currentLevel}
        onChange={(e) => updateParams("level", e.target.value)}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">全部等级</option>
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>

      {/* Keyword search */}
      <input
        type="text"
        defaultValue={currentKeyword}
        placeholder="搜索医院名称..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateParams("keyword", (e.target as HTMLInputElement).value);
          }
        }}
        className="flex-1 min-w-[200px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />

      <button
        onClick={() => router.push("/hospitals")}
        className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        清除筛选
      </button>
    </div>
  );
}
