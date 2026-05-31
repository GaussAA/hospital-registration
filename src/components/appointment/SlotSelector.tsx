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
  const dateRange = useMemo(() => {
    if (schedules.length === 0) return [];
    const dates = schedules.map((s) => s.date).sort();
    const earliest = parseISO(dates[0]);
    return Array.from({ length: 7 }, (_, i) => addDays(earliest, i));
  }, [schedules]);

  if (schedules.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] px-8 py-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-3xl mb-4">
          📅
        </div>
        <p className="text-sm text-[var(--text-secondary)]">暂无可用号源</p>
        <p className="text-xs text-[var(--text-muted)] mt-1.5">请稍后再来查看或选择其他医生</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">选择就诊时间</h3>
      </div>

      <SlotSelectorDesktop
        dateRange={dateRange}
        schedules={schedules}
        selectedScheduleId={selectedScheduleId}
        onSelect={onSelect}
      />

      <SlotSelectorMobile
        dateRange={dateRange}
        schedules={schedules}
        selectedScheduleId={selectedScheduleId}
        onSelect={onSelect}
      />
    </div>
  );
}
