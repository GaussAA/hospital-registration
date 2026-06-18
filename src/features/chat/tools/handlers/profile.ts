import type { ToolContext } from "../../types";
import { getPatientProfilesByUser, createPatientProfileQuery as createPatientProfile } from "@/features/auth";
import { fmtProfile } from "../formatters";
import { createPatientProfileSchema } from "../validators";

export async function handleGetPatientProfiles(
  _args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  if (!ctx.userId) return "您还未登录，请先登录后再查看就诊人信息。";

  const profiles = await getPatientProfilesByUser(ctx.userId);

  if (profiles.length === 0) {
    return "您还没有添加就诊人，请输入就诊人信息进行添加（姓名、身份证号、手机号、性别）。";
  }

  return (
    "您的就诊人列表：\n\n" +
    profiles.map((p, i) => `${i + 1}. ${fmtProfile(p)}`).join("\n") +
    "\n\n请让用户选择就诊人，确定后使用对应就诊人的 [ID:xxx] 作为 profileId 参数调用 create_registration。"
  );
}

export async function handleCreatePatientProfile(
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  if (!ctx.userId) return "您还未登录，请先登录后再添加就诊人。";

  const parsed = createPatientProfileSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { name, idCard, phone, gender } = parsed.data;

  const profile = await createPatientProfile(ctx.userId, {
    name,
    idCard,
    phone,
    gender,
  });

  return `✅ 就诊人添加成功：${fmtProfile(profile)}`;
}
