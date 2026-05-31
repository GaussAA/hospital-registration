import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiHandler } from "@/lib/utils/api-handler";
import { success } from "@/lib/utils/response";
import { ValidationError } from "@/lib/utils/errors";
import { createRegistration, listRegistrations } from "@/lib/services/registration.service";
import { createRegistrationSchema } from "@/lib/validations/registration.schema";
import { z } from "zod";

const listAppointmentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["pending", "done", "cancelled"]).optional(),
});

/**
 * GET /api/appointments
 * List registrations for the current user, with optional status filter and pagination.
 */
export const GET = apiHandler(async (req, { user }) => {
  const { searchParams } = new URL(req.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => { raw[key] = value; });
  const query = listAppointmentsSchema.parse(raw);

  const result = await listRegistrations(
    user!.userId,
    query.status,
    query.page,
    query.pageSize
  );

  return NextResponse.json(success(result));
}, { requireAuth: true });

/**
 * POST /api/appointments
 * Create a new registration (appointment). Core transactional logic.
 */
export const POST = apiHandler(async (req, { user }) => {
  const body = await req.json();

  // Validate input
  const parsed = createRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = (parsed.error.issues?.[0]?.message) ?? "参数不完整";
    throw new ValidationError(firstError);
  }

  const { scheduleId, profileId, type } = parsed.data;

  const registration = await createRegistration(
    user!.userId,
    scheduleId,
    profileId,
    type
  );

  // Invalidate cached pages that show schedule data
  revalidatePath("/hospitals", "layout");

  return NextResponse.json(success({ registration }), { status: 201 });
}, { requireAuth: true });
