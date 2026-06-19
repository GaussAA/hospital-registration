"use client";

import { isSameDay } from "date-fns";

interface SlotData {
  id: string;
  date: string;
  timeSlot: string;
  quota: number;
  bookedCount: number;
  remaining: number;
  type: string;
}

interface SlotSelectorMobileProps {
  dateRange: Date[];
  schedules: SlotData[];
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

const weekDayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function SlotSelectorMobile({
  dateRange,
  schedules,
  selectedScheduleId,
  onSelect,
}: SlotSelectorMobileProps) {
  const timeSlots: Array<"am" | "pm" | "evening"> = ["am", "pm", "evening"];
  const today = new Date();

  return (
    <div className="md:hidden space-y-2">
      {dateRange.map((day) => {
        const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
        const daySchedules = schedules.filter((s) => s.date === dateStr);
        if (daySchedules.length === 0) return null;

        const isToday = isSameDay(day, today);

        return (
          <div
            key={dateStr}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm card-hover"
          >
            {/* Date header */}
            <div
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${
                isToday
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 text-blue-700 dark:text-blue-300"
                  : "bg-muted text-foreground"
              }`}
            >
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
              {`${day.getMonth() + 1}月${day.getDate()}日 ${weekDayNames[day.getDay()]}`}
            </div>

            {/* Time slot rows */}
            <div className="divide-y divide-border">
              {timeSlots.map((slot) => {
                const slots = daySchedules.filter((s) => s.timeSlot === slot);
                if (slots.length === 0) return null;
                return (
                  <div key={slot} className="flex items-center gap-3 px-4 py-3">
                    <span className="shrink-0 w-10 text-xs font-medium text-muted-foreground">
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
                            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                                : isFull
                                  ? "bg-muted text-muted-foreground cursor-not-allowed line-through opacity-50"
                                  : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 active:scale-[0.97]"
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
  );
}
