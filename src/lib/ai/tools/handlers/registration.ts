import type { ToolContext } from "../../types";
import { createRegistration, listRegistrations, cancelRegistration } from "@/lib/services/registration.service";
import { statusLabels, timeSlotLabels, typeLabels } from "../formatters";
import { createRegistrationSchema, listRegistrationsSchema, cancelRegistrationSchema } from "../validators";

export async function handleCreateRegistration(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  if (!ctx.userId) return "您还未登录，请先登录后再进行挂号。";

  const parsed = createRegistrationSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { scheduleId, profileId, type } = parsed.data;

  try {
    const registration = await createRegistration(ctx.userId, scheduleId, profileId, type);

    return (
      `✅ 挂号成功！\n\n` +
      `🏥 医院：${(registration as any).doctor.department.hospital.name}\n` +
      `📋 科室：${(registration as any).doctor.department.name}\n` +
      `👨‍⚕️ 医生：${(registration as any).doctor.name}（${(registration as any).doctor.title}）\n` +
      `🧑 就诊人：${(registration as any).profile.name}\n` +
      `📅 时间：${registration.date} ${timeSlotLabels[registration.timeSlot] || registration.timeSlot}\n` +
      `🎫 号类：${typeLabels[registration.type] || registration.type}\n` +
      `🆔 挂号编号：${registration.id}\n\n` +
      `请按时就诊！`
    );
  } catch (e: any) {
    return `❌ 挂号失败：${e.message}`;
  }
}

export async function handleListRegistrations(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  if (!ctx.userId) return "您还未登录，请先登录后再查看挂号记录。";

  const parsed = listRegistrationsSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { status } = parsed.data;
  const result = await listRegistrations(ctx.userId, status, 1, 20);

  if (result.list.length === 0) return "暂未找到挂号记录。";

  return (
    `您的挂号记录（共${result.total}条）：\n\n` +
    result.list
      .map(
        (r: any, i: number) =>
          `${i + 1}. 🆔 ${r.id}\n` +
          `   🏥 ${r.doctor.department.hospital.name} | ${r.doctor.department.name} | ${r.doctor.name} ${r.doctor.title}\n` +
          `   📅 ${r.date} ${timeSlotLabels[r.timeSlot] || r.timeSlot} | 状态：${statusLabels[r.status] || r.status}\n` +
          `   🧑 就诊人：${r.profile.name}`,
      )
      .join("\n\n") +
    "\n\n如需取消挂号，请提供挂号编号。"
  );
}

export async function handleCancelRegistration(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  if (!ctx.userId) return "您还未登录，请先登录后再操作。";

  const parsed = cancelRegistrationSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { registrationId } = parsed.data;

  try {
    await cancelRegistration(registrationId, ctx.userId);
    return `✅ 挂号已取消成功（编号：${registrationId}）`;
  } catch (e: any) {
    return `❌ 取消失败：${e.message}`;
  }
}
