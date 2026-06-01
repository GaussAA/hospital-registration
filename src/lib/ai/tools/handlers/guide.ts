import { getPrisma } from "@/lib/db";
import { visionCompletion, isProviderConfigured } from "@/lib/ai/provider";
import { imageTypeLabels } from "../formatters";
import { getRegistrationGuideSchema, analyzeImageSchema } from "../validators";
import fs from "fs/promises";
import path from "path";

export async function handleGetRegistrationGuide(
  args: Record<string, unknown>,
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

/**
 * 根据图片类型生成分析提示词。
 */
function buildImagePrompt(imageType?: string): string {
  switch (imageType) {
    case "lab_report":
      return "请分析这张化验单/检验报告。请提取以下信息：\n1. 检查项目名称和结果值\n2. 参考范围\n3. 异常指标（用⚠️标注偏高或偏低）\n4. 简要解读\n\n注意：请用通俗易懂的语言解释，AI解读仅供参考。";
    case "exam_report":
      return "请分析这张检查报告。请提取以下信息：\n1. 检查类型\n2. 关键发现\n3. 值得关注的异常\n4. 简要解读\n\n注意：请用通俗易懂的语言解释，AI解读仅供参考。";
    case "ct_scan":
      return "请分析这张CT/影像学图片。请描述：\n1. 影像类型和部位\n2. 可见的解剖结构\n3. 值得注意的发现\n4. 简要解读\n\n注意：AI影像分析仅供参考，请以放射科正式报告和医生意见为准。";
    case "prescription":
      return "请分析这张处方单。请提取：\n1. 药品名称\n2. 用法用量\n3. 注意事项（如有）\n\n注意：用药请遵医嘱，不要自行调整。";
    default:
      return "请分析这张医疗相关图片。请描述你看到了什么，并提取关键医疗信息。\n\n注意：AI解读仅供参考，最终诊断请以医生意见为准。";
  }
}

export async function handleAnalyzeImage(
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = analyzeImageSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { imageUrl, imageType } = parsed.data;
  const label = imageType ? (imageTypeLabels[imageType] || imageType) : "图片";

  // 检查 AI 是否配置
  if (!isProviderConfigured()) {
    return `已收到您上传的${label}。\n\nAI 视觉服务尚未配置 API 密钥，暂时无法分析图片内容。`;
  }

  try {
    // 如果是本地图片（以 /uploads/ 开头），转换为完整 URL
    let fullImageUrl = imageUrl;
    if (imageUrl.startsWith("/")) {
      // 尝试从本地读取并转为 base64（用于本地开发环境）
      try {
        const localPath = path.join(process.cwd(), "public", imageUrl);
        const imageBuffer = await fs.readFile(localPath);
        const mime = imageUrl.endsWith(".png") ? "image/png"
          : imageUrl.endsWith(".webp") ? "image/webp"
          : imageUrl.endsWith(".gif") ? "image/gif"
          : "image/jpeg";
        fullImageUrl = `data:${mime};base64,${imageBuffer.toString("base64")}`;
      } catch {
        // 如果读不到本地文件，直接用原始 URL（可能是外部 URL）
        fullImageUrl = imageUrl;
      }
    }

    // 调用视觉 API
    const prompt = buildImagePrompt(imageType);
    const analysis = await visionCompletion(fullImageUrl, prompt);

    return (
      `📷 **${label}分析结果**\n\n` +
      `${analysis}\n\n` +
      `> ⚠️ AI分析仅供参考，最终的诊断和治疗方案请以医生的专业意见为准。`
    );
  } catch (error: unknown) {
    console.error("[analyzeImage] Error:", error);
    return `图片分析请求失败：${error instanceof Error ? error.message : "未知错误"}。请稍后重试。`;
  }
}
