import { z } from "zod";

export const doctorIdSchema = z.object({
  doctorId: z.string().min(1, "医生ID不能为空"),
});
