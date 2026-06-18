import { listDoctorsByDepartment, getDoctorById } from "@/features/hospital";
import { fmtDoctor } from "../formatters";
import { searchDoctorsSchema, getDoctorDetailSchema } from "../validators";

export async function handleSearchDoctors(
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = searchDoctorsSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { departmentId } = parsed.data;

  try {
    const doctors = await listDoctorsByDepartment(departmentId);

    if (doctors.length === 0) return "该科室暂无医生。";
    const header = `医生列表：\n\n`;
    return (
      header +
      doctors.map((d) => `👨‍⚕️ ${fmtDoctor(d)}`).join("\n") +
      "\n\n请输入医生名称或编号查看排班和挂号。"
    );
  } catch {
    return "未找到该科室。";
  }
}

export async function handleGetDoctorDetail(
  args: Record<string, unknown>,
): Promise<string> {
  const parsed = getDoctorDetailSchema.safeParse(args);
  if (!parsed.success) {
    return `参数错误：${parsed.error.issues.map((i) => i.message).join("；")}`;
  }

  const { doctorId } = parsed.data;

  try {
    const doctor = await getDoctorById(doctorId);
    const intro = doctor.introduction || "暂无简介";
    return (
      `👨‍⚕️ ${fmtDoctor(doctor)}\n` +
      `所在医院：${doctor.hospitalName}\n` +
      `所在科室：${doctor.departmentName}\n` +
      `简介：${intro}`
    );
  } catch {
    return "未找到该医生。";
  }
}
