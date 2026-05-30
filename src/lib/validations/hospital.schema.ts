import { z } from "zod";

export const listHospitalsSchema = z.object({
  city: z.string().optional(),
  level: z.string().optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(12),
});
