"use client";

interface SlotData {
  id: string;
  date: string;
  timeSlot: string;
  quota: number;
  bookedCount: number;
  remaining: number;
  type: string;
}

interface SlotSelectorDesktopProps {
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

const weekDayNames = ["日", "一", "二", "三", "四", "五", "六"];

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SlotSelectorDesktop({
  dateRange,
  schedules,
  selectedScheduleId,
  onSelect,
}: SlotSelectorDesktopProps) {
  const timeSlots: Array<"am" | "pm" | "evening"> = ["am", "pm", "evening"];

  const getByDateAndSlot = (dateStr: string, timeSlot: string) =>
    schedules.filter((s) => s.date === dateStr && s.timeSlot === timeSlot);

  if (schedules.length === 0) return null;

  return (
    <div className="hidden md:block bg-white dark:bg-[#1e293b] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80">
              <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800/80 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[60px]">
                时段
              </th>
              {dateRange.map((day) => {
                const dateStr = formatDate(day);
                return (
                  <th
                    key={dateStr}
                    className="px-3 py-3 text-center font-medium min-w-[100px] text-gray-700 dark:text-gray-200"
                  >
                    <div className="text-sm">{`${day.getMonth() + 1}/${day.getDate()}`}</div>
                    <div className="text-xs mt-0.5 opacity-70">{weekDayNames[day.getDay()]}</div>
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
                  const dateStr = formatDate(day);
                  const daySlots = getByDateAndSlot(dateStr, slot);

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
  );
}
