import { z } from "zod";

/**
 * Schema for creating a new registration (appointment).
 */
export const createRegistrationSchema = z.object({
  scheduleId: z.string().min(1, "排班ID不能为空"),
  profileId: z.string().min(1, "就诊人ID不能为空"),
  type: z.enum(["normal", "expert", "special"]),
});

/**
 * Schema for cancelling a registration.
 */
export const cancelRegistrationSchema = z.object({
  reason: z.string().optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>;
