import { z } from "zod";

/**
 * Registration schema.
 * Requires at least email or phone.
 */
export const registerSchema = z
  .object({
    name: z.string().min(1, "姓名不能为空"),
    email: z.string().email("邮箱格式不正确").optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^\d{11}$/, "手机号格式不正确")
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, "密码至少 6 位"),
  })
  .refine((data) => data.email || data.phone, {
    message: "邮箱和手机号至少填一项",
  });

/**
 * Login schema.
 */
export const loginSchema = z.object({
  account: z.string().min(1, "账号不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
