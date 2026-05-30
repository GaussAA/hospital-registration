import { NextRequest, NextResponse } from "next/server";
import { success, fail } from "@/lib/utils/response";
import { verifyToken } from "@/lib/utils/jwt";
import { getRegistrationById } from "@/lib/services/registration.service";
import { NotFoundError } from "@/lib/utils/errors";

/**
 * GET /api/appointments/[id]
 * Fetch a single registration by ID (with doctor, department, hospital, profile).
 */
export async function GET(
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

    const registration = await getRegistrationById(id);

    // Ensure the registration belongs to the current user
    if (registration.patientId !== payload.userId) {
      return NextResponse.json(fail(40400, "挂号记录不存在"), { status: 404 });
    }

    return NextResponse.json(success({ registration }));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(fail(40400, error.message), { status: 404 });
    }
    console.error("Get registration error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
