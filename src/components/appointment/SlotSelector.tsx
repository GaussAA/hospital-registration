"use client";

import { useMemo } from "react";
import { addDays, parseISO } from "date-fns";
import SlotSelectorDesktop from "./SlotSelectorDesktop";
import SlotSelectorMobile from "./SlotSelectorMobile";

interface ScheduleSlotData {
  id: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  quota: number;
  bookedCount: number;
  remaining: number;
  type: string;
}

interface SlotSelectorProps {
  schedules: ScheduleSlotData[];
  selectedScheduleId?: string;
  onSelect: (scheduleId: string, type: "normal" | "expert" | "special") => void;
}

export default function SlotSelector({
  schedules,
  selectedScheduleId,
  onSelect,
}: SlotSelectorProps) {
  // Compute the 7-day window from the earliest schedule date
  const dateRange = useMemo(() => {
    if (schedules.length === 0) return [];
    const dates = schedules.map((s) => s.date).sort();
    const earliest = parseISO(dates[0]);
    return Array.from({ length: 7 }, (_, i) => addDays(earliest, i));
  }, [schedules]);

  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] px-6 py-12 text-center">
        <div className="text-4xl mb-3 opacity-50">📅</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">暂无可用号源</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">选择就诊时间</h3>

      {/* Desktop grid view */}
      <SlotSelectorDesktop
        dateRange={dateRange}
        schedules={schedules}
        selectedScheduleId={selectedScheduleId}
        onSelect={onSelect}
      />

      {/* Mobile card view */}
      <SlotSelectorMobile
        dateRange={dateRange}
        schedules={schedules}
        selectedScheduleId={selectedScheduleId}
        onSelect={onSelect}
      />
    </div>
  );
}
