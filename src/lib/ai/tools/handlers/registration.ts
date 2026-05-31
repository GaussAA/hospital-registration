import type { ToolContext } from "../../types";
import { createRegistration, listRegistrations, cancelRegistration } from "@/lib/services/registration.service";
import { statusLabels, timeSlotLabels, typeLabels } from "../formatters";
import { createRegistrationSchema, listRegistrationsSchema, cancelRegistrationSchema } from "../validators";

// Registration include shape: doctor → { department, hospital (sibling, not nested) }
interface RegistrationDoctor {
  name: string;
  title: string;
  department: { name: string };
  hospital: { name: string; id: string };
}

// Minimal type for registration data used in formatting
interface RegistrationDisplay {
  id: string;
  date: string;
  timeSlot: string;
  type: string;
  status: string;
  doctor: RegistrationDoctor;
  profile: { name: string };
}

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
    const rd = registration as unknown as RegistrationDisplay;

    return (
      `✅ 挂号成功！\n\n` +
      `🏥 医院：${rd.doctor?.hospital?.name || "未知"}\n` +
      `📋 科室：${rd.doctor?.department?.name || "未知"}\n` +
      `👨‍⚕️ 医生：${rd.doctor?.name || "未知"}（${rd.doctor?.title || ""}）\n` +
      `🧑 就诊人：${rd.profile?.name || "未知"}\n` +
      `📅 时间：${registration.date} ${timeSlotLabels[registration.timeSlot] || registration.timeSlot}\n` +
      `🎫 号类：${typeLabels[registration.type] || registration.type}\n` +
      `🆔 挂号编号：${registration.id}\n\n` +
      `请按时就诊！`
    );
  } catch (e: unknown) {
    return `❌ 挂号失败：${(e as { message?: string }).message}`;
  }
}

export async function handleListRegistrations(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  console.log(`[tool:listRegistrations] userId=${ctx.userId?.slice(0, 8)}... args=${JSON.stringify(args)}`);

  if (!ctx.userId) return "您还未登录，请先登录后再查看挂号记录。";

  const parsed = listRegistrationsSchema.safeParse(args);
  if (!parsed.success) {
    console.log(`[tool:listRegistrations] invalid args: ${parsed.error.issues.map((i) => i.message).join("；")}`);
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { status } = parsed.data;
  console.log(`[tool:listRegistrations] querying with status=${status || "all"}`);

  try {
    const result = await listRegistrations(ctx.userId, status, 1, 20);
    console.log(`[tool:listRegistrations] found ${result.total} registrations`);

    if (result.list.length === 0) {
      console.log(`[tool:listRegistrations] no records found for userId=${ctx.userId.slice(0, 8)}`);
      return "暂未找到挂号记录。";
    }

    return (
      `您的挂号记录（共${result.total}条）：\n\n` +
      result.list
        .map(
          (r, i: number) => {
            const d = r as unknown as RegistrationDisplay;
            return `${i + 1}. 🆔 ${d.id}\n` +
              `   🏥 ${d.doctor?.hospital?.name || "未知医院"} | ${d.doctor?.department?.name || "未知科室"} | ${d.doctor?.name || "未知医生"} ${d.doctor?.title || ""}\n` +
              `   📅 ${d.date} ${timeSlotLabels[d.timeSlot as keyof typeof timeSlotLabels] || d.timeSlot} | 状态：${statusLabels[d.status as keyof typeof statusLabels] || d.status}\n` +
              `   🧑 就诊人：${d.profile?.name || "未知"}`;
          }
        )
        .join("\n\n") +
      "\n\n如需取消挂号，请提供挂号编号。"
    );
  } catch (e: unknown) {
    const errMsg = (e as { message?: string }).message || String(e);
    console.log(`[tool:listRegistrations] ERROR: ${errMsg}`);
    return `查询挂号记录时出错：${errMsg}。请稍后重试或联系客服。`;
  }
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
  } catch (e: unknown) {
    return `❌ 取消失败：${(e as { message?: string }).message}`;
  }
}
