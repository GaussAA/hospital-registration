import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { success, fail } from "@/lib/utils/response";
import { verifyToken } from "@/lib/utils/jwt";
import { cancelRegistration } from "@/lib/services/registration.service";
import { NotFoundError, ConflictError } from "@/lib/utils/errors";

/**
 * POST /api/appointments/[id]/cancel
 * Cancel a registration (only if status is "pending").
 */
export async function POST(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const token = _request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(fail(40100, "未认证"), { status: 401 });
    }

    const payload = verifyToken(token);
    const { id } = await props.params;

    const registration = await cancelRegistration(id, payload.userId);

    // Invalidate cached pages that show schedule data
    revalidatePath("/hospitals", "layout");

    return NextResponse.json(success({ registration }));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(fail(40400, error.message), { status: 404 });
    }
    if (error instanceof ConflictError) {
      return NextResponse.json(fail(40900, error.message), { status: 409 });
    }
    console.error("Cancel registration error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
