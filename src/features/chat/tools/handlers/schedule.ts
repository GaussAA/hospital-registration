// eslint-disable-next-line no-restricted-imports
import { getDoctorById, listSchedulesByDoctor } from "@/features/hospital/queries";
import { fmtDoctor, fmtSchedule } from "../formatters";
import { getDoctorSchedulesSchema } from "../validators";

export async function handleGetDoctorSchedules(
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = getDoctorSchedulesSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { doctorId } = parsed.data;

  try {
    const doctor = await getDoctorById(doctorId);
    const schedules = await listSchedulesByDoctor(doctorId);

    if (schedules.length === 0) {
      return `医生"${doctor.name}"未来7天暂无排班。`;
    }

    // Format by date
    const grouped: Record<string, typeof schedules> = {};
    for (const s of schedules) {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    }

    const header = `👨‍⚕️ ${doctor.hospitalName} — ${doctor.departmentName} — ${fmtDoctor(doctor)}\n\n未来7天排班：\n\n`;
    const body = Object.entries(grouped)
      .map(
        ([date, slots]) =>
          `📅 ${date}\n${slots.map((s) => `  ${fmtSchedule(s)}`).join("\n")}`,
      )
      .join("\n\n");

    return header + body + "\n\n请让用户选择日期+时段，确定后使用对应排班的 [ID:xxx] 作为 scheduleId 参数调用 create_registration 进行挂号。";
  } catch {
    return "未找到该医生。";
  }
}
