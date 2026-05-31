import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/utils/api-handler";
import { success, fail } from "@/lib/utils/response";
import { getRegistrationById } from "@/lib/services/registration.service";

/**
 * GET /api/appointments/[id]
 * Fetch a single registration by ID (with doctor, department, hospital, profile).
 */
export const GET = apiHandler<{ id: string }>(async (_req, { params, user }) => {
  const { id } = await params;

  const registration = await getRegistrationById(id);

  // Ensure the registration belongs to the current user
  if (registration.patientId !== user!.userId) {
    return NextResponse.json(fail(40400, "挂号记录不存在"), { status: 404 });
  }

  return NextResponse.json(success({ registration }));
}, { requireAuth: true });
