import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional().default("https://api.deepseek.com"),
  AI_MODEL: z.string().optional().default("deepseek-v4-flash"),
  DATABASE_URL: z.string().optional().default("postgresql://hospital:hospital123@localhost:5432/hospital_registration?schema=public"),
  REDIS_URL: z.string().optional().default("redis://:redis123@localhost:6379/0"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
