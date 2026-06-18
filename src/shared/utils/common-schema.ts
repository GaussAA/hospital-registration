import { z } from "zod";

/**
 * Standard pagination query parameters.
 * Coerces string values to numbers with sensible defaults and bounds.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Extract and validate query parameters from a URL search params.
 * Returns the validated data or throws with a clear message.
 */
export function parseQuery<T extends z.ZodTypeAny>(schema: T, searchParams: URLSearchParams): z.infer<T> {
  // Convert URLSearchParams to a plain object
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const result = schema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message || "参数验证失败");
  }
  return result.data;
}
