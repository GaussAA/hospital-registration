"use client";

import { format, addDays, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";

export interface ScheduleSlot {
  id: string;
  date: string;
  timeSlot: "am" | "pm" | "evening";
  type: string;
  quota: number;
  bookedCount: number;
  remaining: number;
}

export interface ScheduleCalendarProps {
  schedules: ScheduleSlot[];
  doctorId: string;
  selectedSlotId?: string;
  onSlotSelect?: (slot: ScheduleSlot) => void;
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

export default function ScheduleCalendar({ schedules, selectedSlotId, onSlotSelect }: ScheduleCalendarProps) {
  // Generate next 7 days
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const timeSlots: Array<"am" | "pm" | "evening"> = ["am", "pm", "evening"];

  const getSlotsForDayAndTime = (date: Date, timeSlot: "am" | "pm" | "evening") => {
    const dateStr = format(date, "yyyy-MM-dd");
    return schedules.filter((s) => s.date === dateStr && s.timeSlot === timeSlot);
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">排班日历</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">未来 7 天出诊信息</p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-3 text-left text-[var(--text-secondary)] font-medium">时段</th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`px-4 py-3 text-center font-medium ${
                    isSameDay(day, today) ? "text-blue-600 dark:text-blue-400" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <div>{format(day, "MM/dd", { locale: zhCN })}</div>
                  <div className="text-xs">{format(day, "EEE", { locale: zhCN })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot} className="border-t border-gray-100 dark:border-gray-700/50">
                <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">
                  {timeSlotLabels[slot]}
                </td>
                {days.map((day) => {
                  const daySlots = getSlotsForDayAndTime(day, slot);
                  return (
                    <td key={day.toISOString()} className="px-2 py-3 text-center">
                      {daySlots.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {daySlots.map((s) => (
                            <button
                              key={s.id}
                              disabled={s.remaining <= 0}
                              onClick={() => onSlotSelect?.(s)}
                              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                                selectedSlotId === s.id
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-300 dark:ring-blue-600 scale-105"
                                  : s.remaining > 0
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                                    : "bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed"
                              }`}
                            >
                              <div>{typeLabels[s.type] ?? s.type}</div>
                              <div className={selectedSlotId === s.id ? "text-blue-100" : s.remaining > 0 ? "text-blue-500 dark:text-blue-400" : "text-[var(--text-muted)]"}>
                                剩余 {s.remaining}/{s.quota}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--border-default)] text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden p-4 space-y-4">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayAllSlots = schedules.filter((s) => s.date === dateStr);
          return (
            <div key={day.toISOString()} className="border border-gray-100 dark:border-gray-700/50 rounded-lg p-3">
              <div className={`text-sm font-medium mb-2 ${isSameDay(day, today) ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}>
                {format(day, "M月d日 EEEE", { locale: zhCN })}
              </div>
              {dayAllSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dayAllSlots.map((s) => (
                    <button
                      key={s.id}
                      disabled={s.remaining <= 0}
                      onClick={() => onSlotSelect?.(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedSlotId === s.id
                          ? "bg-blue-600 text-white shadow-md"
                          : s.remaining > 0
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                            : "bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-not-allowed"
                      }`}
                    >
                      {timeSlotLabels[s.timeSlot]} {typeLabels[s.type] ?? s.type}
                      <span className="ml-1">
                        ({s.remaining}/{s.quota})
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">暂无排班</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
