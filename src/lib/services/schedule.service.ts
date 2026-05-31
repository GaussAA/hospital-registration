import { getPrisma } from "@/lib/db";
import { format, addDays } from "date-fns";
import type { ScheduleSlotDTO } from "@/types/dto";

export interface ScheduleSlotData {
  id: string;
  doctorId: string;
  date: string;
  timeSlot: "am" | "pm" | "evening";
  type: string;
  quota: number;
  bookedCount: number;
  remaining: number;
}

export async function listSchedulesByDoctor(doctorId: string): Promise<ScheduleSlotData[]> {
  const prisma = await getPrisma();

  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(format(addDays(today, i), "yyyy-MM-dd"));
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      doctorId,
      date: { in: dates },
    },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }, { type: "asc" }],
  });

  return schedules.map((s) => ({
    id: s.id,
    doctorId: s.doctorId,
    date: s.date,
    timeSlot: s.timeSlot as "am" | "pm" | "evening",
    type: s.type,
    quota: s.quota,
    bookedCount: s.bookedCount,
    remaining: s.quota - s.bookedCount,
  }));
}
