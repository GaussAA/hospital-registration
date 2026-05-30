import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { success, fail } from "@/lib/utils/response";
import { verifyToken } from "@/lib/utils/jwt";
import { NotFoundError, ConflictError } from "@/lib/utils/errors";
import { createRegistration, listRegistrations } from "@/lib/services/registration.service";
import { createRegistrationSchema } from "@/lib/validations/registration.schema";

/**
 * GET /api/appointments
 * List registrations for the current user, with optional status filter and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(fail(40100, "未认证"), { status: 401 });
    }

    const payload = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10))
    );

    const result = await listRegistrations(
      payload.userId,
      status as "pending" | "done" | "cancelled" | undefined,
      page,
      pageSize
    );

    return NextResponse.json(success(result));
  } catch (error) {
    console.error("List registrations error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}

/**
 * POST /api/appointments
 * Create a new registration (appointment). Core transactional logic.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(fail(40100, "未认证"), { status: 401 });
    }

    const payload = verifyToken(token);
    const body = await request.json();

    // Validate input
    const parsed = createRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      // Zod 4 stores error details in message as JSON string
      let firstError = "参数不完整";
      try {
        const issues = JSON.parse(parsed.error.message);
        if (issues.length > 0) firstError = issues[0].message;
      } catch {}
      return NextResponse.json(fail(40001, firstError), { status: 400 });
    }

    const { scheduleId, profileId, type } = parsed.data;

    const registration = await createRegistration(
      payload.userId,
      scheduleId,
      profileId,
      type
    );

    // Invalidate cached pages that show schedule data
    revalidatePath("/hospitals", "layout");

    return NextResponse.json(success({ registration }), { status: 201 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(fail(40400, error.message), { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json(fail(40900, error.message), { status: 409 });
    }
    console.error("Create registration error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
