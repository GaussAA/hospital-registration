import { z } from "zod";

export const searchHospitalsSchema = z.object({
  keyword: z.string().optional(),
  city: z.string().optional(),
  level: z.string().optional(),
});

export const searchDepartmentsSchema = z.object({
  hospitalId: z.string().min(1, "医院ID不能为空"),
});

export const searchDoctorsSchema = z.object({
  departmentId: z.string().min(1, "科室ID不能为空"),
});

export const getDoctorSchedulesSchema = z.object({
  doctorId: z.string().min(1, "医生ID不能为空"),
});

export const getPatientProfilesSchema = z.object({});

export const createPatientProfileSchema = z.object({
  name: z.string().min(1, "就诊人姓名不能为空"),
  idCard: z.string().min(1, "身份证号不能为空"),
  phone: z.string().min(1, "手机号不能为空"),
  gender: z.enum(["male", "female"]),
});

export const createRegistrationSchema = z.object({
  scheduleId: z.string().min(1, "排班ID不能为空"),
  profileId: z.string().min(1, "就诊人ID不能为空"),
  type: z.enum(["normal", "expert", "special"]),
});

export const listRegistrationsSchema = z.object({
  status: z.enum(["pending", "done", "cancelled"]).optional(),
});

export const cancelRegistrationSchema = z.object({
  registrationId: z.string().min(1, "挂号记录ID不能为空"),
});

export const getHospitalDetailSchema = z.object({
  hospitalId: z.string().min(1, "医院ID不能为空"),
});

export const getDoctorDetailSchema = z.object({
  doctorId: z.string().min(1, "医生ID不能为空"),
});

export const recommendDepartmentSchema = z.object({
  symptoms: z.string().min(1, "症状描述不能为空"),
});

export const getRegistrationGuideSchema = z.object({
  hospitalId: z.string().optional(),
});

export const analyzeImageSchema = z.object({
  imageUrl: z.string().min(1, "图片URL不能为空"),
  imageType: z.string().optional(),
});
