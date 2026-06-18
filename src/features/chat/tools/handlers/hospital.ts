// eslint-disable-next-line no-restricted-imports
import { listHospitals, getHospitalById, listDepartmentsByHospital } from "@/features/hospital/queries";
import { fmtHospital, fmtDepartment } from "../formatters";
import { searchHospitalsSchema, getHospitalDetailSchema } from "../validators";

export async function handleSearchHospitals(
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = searchHospitalsSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { keyword, city, level } = parsed.data;
  const result = await listHospitals({
    keyword,
    city,
    level,
    page: 1,
    pageSize: 10,
  });

  if (result.list.length === 0) return "抱歉，没有找到符合条件的医院。";
  const header = `找到了 ${result.list.length} 家医院：\n\n`;
  return (
    header +
    result.list.map((h, i) => `【${i + 1}】🏥 ${fmtHospital(h)}`).join("\n") +
    "\n\n请让用户选择编号或医院名称，确定后使用对应医院的 [ID:xxx] 调用后续工具（如 search_departments）。不要直接传医院名称。"
  );
}

export async function handleGetHospitalDetail(
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = getHospitalDetailSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { hospitalId } = parsed.data;
  try {
    const hospital = await getHospitalById(hospitalId);
    let result = `🏥 ${fmtHospital(hospital)}\n`;
    result += `简介：${hospital.description || "暂无简介"}\n`;

    try {
      const departments = await listDepartmentsByHospital(hospitalId);
      if (departments.length > 0) {
        result += `\n科室（共${departments.length}个）：\n${departments.slice(0, 5).map((d) => `  📋 ${fmtDepartment(d)}`).join("\n")}`;
      }
    } catch {
      // Departments fetch is secondary info; ignore errors
    }

    return result;
  } catch {
    return "未找到该医院。";
  }
}
