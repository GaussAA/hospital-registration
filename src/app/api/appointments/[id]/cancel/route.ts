import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/utils/api-handler";
import { success } from "@/lib/utils/response";
import { cancelRegistration } from "@/lib/services/registration.service";

/**
 * POST /api/appointments/[id]/cancel
 * Cancel a registration (only if status is "pending").
 */
export const POST = apiHandler<{ id: string }>(async (_req, { params, user }) => {
  const { id } = await params;

  const registration = await cancelRegistration(id, user!.userId);

  // Invalidate cached pages that show schedule data
  revalidatePath("/hospitals", "layout");

  return NextResponse.json(success({ registration }));
}, { requireAuth: true });
