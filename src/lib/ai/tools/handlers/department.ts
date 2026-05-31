import type { ToolContext } from "../../types";
import { listDepartmentsByHospital } from "@/lib/services/department.service";
import { fmtDepartment } from "../formatters";
import { searchDepartmentsSchema, recommendDepartmentSchema } from "../validators";

/**
 * Symptom-to-department mapping for recommendation.
 */
const symptomMap: Record<string, string[]> = {
  "发烧": ["发热门诊", "呼吸内科", "感染科"],
  "咳嗽": ["呼吸内科", "胸外科"],
  "头痛": ["神经内科", "神经外科"],
  "胸闷": ["心血管内科", "呼吸内科"],
  "腹痛": ["消化内科", "胃肠外科", "急诊科"],
  "腹泻": ["消化内科", "肠道门诊"],
  "呕吐": ["消化内科", "急诊科"],
  "皮疹": ["皮肤科"],
  "关节痛": ["风湿免疫科", "骨科"],
  "腰痛": ["骨科", "泌尿外科", "肾内科"],
  "心慌": ["心血管内科"],
  "失眠": ["精神心理科", "神经内科"],
  "头晕": ["神经内科", "耳鼻喉科", "骨科"],
  "耳鸣": ["耳鼻喉科"],
  "视力下降": ["眼科"],
  "尿频": ["泌尿外科", "肾内科"],
  "便秘": ["消化内科"],
  "过敏": ["皮肤科", "过敏反应科"],
  "外伤": ["急诊科", "骨科", "普外科"],
  "骨折": ["骨科", "急诊科"],
  "孕期": ["妇产科"],
  "月经不调": ["妇科", "内分泌科"],
  "胸痛": ["心血管内科", "呼吸内科", "急诊科"],
  "喉咙痛": ["耳鼻喉科", "呼吸内科"],
  "牙痛": ["口腔科"],
  "背痛": ["骨科", "康复科"],
  "水肿": ["肾内科", "心血管内科"],
  "消瘦": ["内分泌科", "消化内科"],
  "贫血": ["血液科"],
  "淋巴结肿大": ["血液科", "肿瘤科", "普外科"],
};

export async function handleSearchDepartments(
  args: Record<string, unknown>,
  _context: ToolContext,
): Promise<string> {
  const parsed = searchDepartmentsSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { hospitalId } = parsed.data;

  try {
    const departments = await listDepartmentsByHospital(hospitalId);

    if (departments.length === 0) return "该医院暂无可选科室。";
    const header = `科室列表：\n\n`;
    return (
      header +
      departments.map((d) => `📋 ${fmtDepartment(d)}`).join("\n") +
      "\n\n请输入科室名称或编号查看医生。"
    );
  } catch {
    return "未找到该医院。";
  }
}

export async function handleRecommendDepartment(
  args: Record<string, unknown>,
  _context: ToolContext,
): Promise<string> {
  const parsed = recommendDepartmentSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { symptoms } = parsed.data;
  const symptomsLower = symptoms.toLowerCase();

  const matched: string[] = [];
  const matchedSymptoms: string[] = [];

  for (const [symptom, depts] of Object.entries(symptomMap)) {
    if (symptomsLower.includes(symptom)) {
      matched.push(...depts);
      matchedSymptoms.push(symptom);
    }
  }

  if (matched.length === 0) {
    return `根据您描述的"${symptoms}"，我没有找到特别匹配的科室。\n\n建议您先挂**全科**或**导诊台**咨询，或在平台上搜索相关症状的科室。\n\n如果症状比较严重，请及时到**急诊科**就诊。`;
  }

  const uniqueDepts = [...new Set(matched)];
  const symptomList = matchedSymptoms.join("、");

  return (
    `根据您描述的"${symptoms}"，检测到以下症状：${symptomList}\n\n` +
    `建议您考虑挂以下科室：\n\n` +
    uniqueDepts.map((d, i) => `${i + 1}. **${d}**`).join("\n") +
    `\n\n> ⚠️ 以上推荐仅供参考，如有严重不适请立即前往医院急诊科就诊。`
  );
}
