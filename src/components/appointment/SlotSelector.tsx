"use client";

import { useMemo } from "react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

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

const timeSlotLabels: Record<string, string> = {
  am: "上午",
  pm: "下午",
  evening: "晚间",
};

const typeLabels: Record<string, string> = {
  normal: "普通号",
  expert: "专家号",
  special: "特需号",
};

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

  const timeSlots: Array<"am" | "pm" | "evening"> = ["am", "pm", "evening"];

  const getByDateAndSlot = (date: Date, timeSlot: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return schedules.filter((s) => s.date === dateStr && s.timeSlot === timeSlot);
  };

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

      {/* ── Desktop: Grid/Calendar Table ── */}
      <div className="hidden md:block bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800/80 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[60px]">
                  时段
                </th>
                {dateRange.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const hasSlots = schedules.some((s) => s.date === dateStr);
                  return (
                    <th
                      key={dateStr}
                      className={`px-3 py-3 text-center font-medium min-w-[100px] ${
                        hasSlots
                          ? isSameDay(day, new Date())
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-200"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    >
                      <div className="text-sm">{format(day, "M/d", { locale: zhCN })}</div>
                      <div className="text-xs mt-0.5 opacity-70">
                        {format(day, "EE", { locale: zhCN })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot} className="border-t border-gray-100 dark:border-gray-700/50">
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#1e293b] px-3 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-500" />
                      {timeSlotLabels[slot]}
                    </div>
                  </td>
                  {dateRange.map((day) => {
                    const daySlots = getByDateAndSlot(day, slot);
                    const dateStr = format(day, "yyyy-MM-dd");

                    return (
                      <td key={dateStr} className="px-2 py-2 text-center align-top">
                        {daySlots.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {daySlots.map((s) => {
                              const isSelected = selectedScheduleId === s.id;
                              const isFull = s.remaining <= 0;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  disabled={isFull}
                                  onClick={() => onSelect(s.id, s.type as "normal" | "expert" | "special")}
                                  className={`
                                    relative rounded-lg px-2 py-1.5 text-xs font-medium
                                    transition-all
                                    ${
                                      isSelected
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-300 dark:ring-blue-600 scale-105"
                                        : isFull
                                          ? "bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through"
                                          : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:shadow-sm cursor-pointer border border-blue-200 dark:border-blue-800/50"
                                    }
                                  `}
                                >
                                  <div className="font-semibold">{typeLabels[s.type] ?? s.type}</div>
                                  <div className={`mt-0.5 text-[10px] ${
                                    isSelected
                                      ? "text-blue-100"
                                      : isFull
                                        ? "text-gray-300 dark:text-gray-600"
                                        : "text-blue-500 dark:text-blue-400"
                                  }`}>
                                    {isFull ? "已满" : `余${s.remaining}/${s.quota}`}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-200 dark:text-gray-700 text-xs select-none">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile: Compact Cards ── */}
      <div className="md:hidden space-y-2">
        {dateRange.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const daySchedules = schedules.filter((s) => s.date === dateStr);
          if (daySchedules.length === 0) return null;

          const today = new Date();
          return (
            <div
              key={dateStr}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] overflow-hidden"
            >
              {/* Date header */}
              <div className={`px-4 py-2 text-sm font-medium ${
                isSameDay(day, today)
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200"
              }`}>
                {format(day, "M月d日 EEEE", { locale: zhCN })}
              </div>

              {/* Time slot rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {timeSlots.map((slot) => {
                  const slots = daySchedules.filter((s) => s.timeSlot === slot);
                  if (slots.length === 0) return null;
                  return (
                    <div key={slot} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="shrink-0 w-10 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {timeSlotLabels[slot]}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {slots.map((s) => {
                          const isSelected = selectedScheduleId === s.id;
                          const isFull = s.remaining <= 0;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={isFull}
                              onClick={() => onSelect(s.id, s.type as "normal" | "expert" | "special")}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : isFull
                                    ? "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through"
                                    : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              }`}
                            >
                              {typeLabels[s.type] ?? s.type}
                              <span className="ml-1 opacity-70">
                                {isFull ? "已满" : `${s.remaining}号`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
