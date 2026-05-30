import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { verifyToken } from "@/lib/utils/jwt";
import { success, fail } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const token = _request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(fail(40100, "未认证"), { status: 401 });
    }
    const payload = verifyToken(token);

    const { id } = await props.params;
    const prisma = await getPrisma();

    const profile = await prisma.patientProfile.findUnique({
      where: { id },
      select: { id: true, name: true, idCard: true, phone: true, gender: true, userId: true },
    });

    if (!profile) {
      throw new NotFoundError("就诊人不存在");
    }

    // Ownership check: only the owner can view their own profiles
    if (profile.userId !== payload.userId) {
      return NextResponse.json(fail(403, "无权访问该就诊人信息"), { status: 403 });
    }

    const { userId: _u, ...safeProfile } = profile;
    return NextResponse.json(success({ profile: safeProfile }));
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(fail(40400, error.message), { status: 404 });
    }
    if (error instanceof Error && (error.message === "未认证" || error.message === "Token 无效")) {
      return NextResponse.json(fail(40100, error.message), { status: 401 });
    }
    console.error("Get patient profile error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
