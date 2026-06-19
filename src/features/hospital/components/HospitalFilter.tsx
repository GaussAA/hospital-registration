"use client";

import { useState, useEffect, startTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { MapPin, Star, Search, X, ChevronDown } from "lucide-react";

const CITIES = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "重庆", "西安"];
const LEVELS = ["三级甲等", "三级乙等", "二级甲等", "二级乙等", "一级甲等", "一级乙等"];

export default function HospitalFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCity = searchParams.get("city") ?? "";
  const currentLevel = searchParams.get("level") ?? "";
  const currentKeyword = searchParams.get("keyword") ?? "";

  const [keywordInput, setKeywordInput] = useState(currentKeyword);
  const debouncedKeyword = useDebounce(keywordInput, 300);

  // Active filter count
  const activeCount = useMemo(() => {
    let count = 0;
    if (currentCity) count++;
    if (currentLevel) count++;
    if (currentKeyword) count++;
    return count;
  }, [currentCity, currentLevel, currentKeyword]);

  // Sync keyword input when URL changes
  useEffect(() => {
    startTransition(() => {
      setKeywordInput(currentKeyword);
    });
  }, [currentKeyword]);

  // Auto-search when debounced keyword changes
  useEffect(() => {
    if (debouncedKeyword !== currentKeyword) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedKeyword) params.set("keyword", debouncedKeyword);
      else params.delete("keyword");
      params.set("page", "1");
      router.push(`/hospitals?${params.toString()}`);
    }
  }, [debouncedKeyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "keyword") params.set("page", "1");
    router.push(`/hospitals?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* City */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={currentCity} onChange={(e) => updateParams("city", e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部城市</option>
            {CITIES.map((city) => (<option key={city} value={city}>{city}</option>))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Level */}
        <div className="relative">
          <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select value={currentLevel} onChange={(e) => updateParams("level", e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] pl-9 pr-8 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部等级</option>
            {LEVELS.map((level) => (<option key={level} value={level}>{level}</option>))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="搜索医院名称..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {keywordInput && (
            <button onClick={() => { setKeywordInput(""); updateParams("keyword", ""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button onClick={() => router.push("/hospitals")}
          className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
          清除
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Active filter tags */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">当前筛选：</span>
          {currentCity && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-3 py-1">
              🏙 {currentCity}
              <button onClick={() => updateParams("city", "")} className="hover:text-blue-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentLevel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 px-3 py-1">
              ⭐ {currentLevel}
              <button onClick={() => updateParams("level", "")} className="hover:text-purple-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {currentKeyword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 px-3 py-1">
              🔍 {currentKeyword}
              <button onClick={() => { setKeywordInput(""); updateParams("keyword", ""); }} className="hover:text-green-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
