"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function HospitalSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("keyword") ?? "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("keyword", value.trim());
    } else {
      params.delete("keyword");
    }
    params.set("page", "1");
    router.push(`/hospitals?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="搜索医院..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] px-4 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 transition-colors"
        >
          搜索
        </button>
      </div>
    </form>
  );
}
