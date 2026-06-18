import { z } from "zod";

// ==================== Hospital ====================

export const listHospitalsSchema = z.object({
  city: z.string().optional(),
  level: z.string().optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(12),
});

// ==================== Department ====================

export const departmentIdSchema = z.object({
  departmentId: z.string().min(1, "科室ID不能为空"),
});

// ==================== Doctor ====================

export const doctorIdSchema = z.object({
  doctorId: z.string().min(1, "医生ID不能为空"),
});
