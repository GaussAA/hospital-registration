import { z } from "zod";

export const departmentIdSchema = z.object({
  departmentId: z.string().min(1, "科室ID不能为空"),
});
