import { getPrisma } from "@/lib/db";
import type { ToolContext } from "../../types";
import { imageTypeLabels } from "../formatters";
import { getRegistrationGuideSchema, analyzeImageSchema } from "../validators";

export async function handleGetRegistrationGuide(
  args: Record<string, unknown>,
  _context: ToolContext,
): Promise<string> {
  const parsed = getRegistrationGuideSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { hospitalId } = parsed.data;
  let hospitalInfo = "";

  if (hospitalId) {
    const prisma = await getPrisma();
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (hospital) {
      hospitalInfo = `\n🏥 医院：${hospital.name}\n📍 地址：${hospital.address}\n📞 电话：${hospital.phone}\n`;
    }
  }

  return (
    `📋 **就诊指南**${hospitalInfo}\n\n` +
    `**一、就诊前准备**\n` +
    `1. **证件**：携带本人身份证/医保卡\n` +
    `2. **病历**：如有既往病历、检查报告，请一并带上\n` +
    `3. **空腹**：如需抽血检查，建议早上空腹就诊\n` +
    `4. **时间**：按预约时间提前15-30分钟到达\n\n` +
    `**二、就诊流程**\n` +
    `1. 凭身份证/医保卡到挂号窗口或自助机取号\n` +
    `2. 到相应科室分诊台报到\n` +
    `3. 等待叫号就诊\n` +
    `4. 医生问诊后根据需要开具检查/药品\n` +
    `5. 缴费→检查/取药\n\n` +
    `**三、注意事项**\n` +
    `1. 取消挂号请至少在就诊前2小时操作\n` +
    `2. 同一时段只能挂一个号源\n` +
    `3. 如需改约，请先取消原挂号再重新预约\n` +
    `4. 急重症请直接前往**急诊科**，无需预约挂号\n` +
    `5. 就诊过程中如有不适，请及时告知医护人员\n\n` +
    `祝您早日康复！🙏`
  );
}

export async function handleAnalyzeImage(
  args: Record<string, unknown>,
  _context: ToolContext,
): Promise<string> {
  const parsed = analyzeImageSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { imageUrl, imageType } = parsed.data;
  const label = imageType ? (imageTypeLabels[imageType] || imageType) : "图片";

  return (
    `我已收到您上传的${label}。\n\n` +
    `系统已记录该图片，AI正在分析中。\n\n` +
    `> 💡 请等待AI对图片内容进行分析解读。\n` +
    `> ⚠️ AI解读仅供参考，最终诊断请以医生意见为准。`
  );
}
