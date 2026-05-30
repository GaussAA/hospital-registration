import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db";
import { verifyToken } from "@/lib/utils/jwt";
import { success, fail } from "@/lib/utils/response";

/**
 * GET /api/patient-profiles — 获取当前用户的所有就诊人
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(fail(40100, "未认证"), { status: 401 });
    }

    let userId: string;
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json(fail(40100, "Token 无效"), { status: 401 });
    }

    const prisma = await getPrisma();
    const profiles = await prisma.patientProfile.findMany({
      where: { userId },
      select: { id: true, name: true, idCard: true, phone: true, gender: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(success(profiles), { status: 200 });
  } catch (error) {
    console.error("Get patient-profiles error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}

/**
 * POST /api/patient-profiles — 新增就诊人
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(fail(40100, "未认证"), { status: 401 });
    }

    let userId: string;
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json(fail(40100, "Token 无效"), { status: 401 });
    }

    const body = await request.json();
    const { name, idCard, phone, gender } = body;

    if (!name || !idCard || !phone || !gender) {
      return NextResponse.json(fail(40001, "请填写完整信息"), { status: 400 });
    }

    if (!["male", "female"].includes(gender)) {
      return NextResponse.json(fail(40001, "性别格式不正确"), { status: 400 });
    }

    const prisma = await getPrisma();
    const profile = await prisma.patientProfile.create({
      data: { userId, name, idCard, phone, gender },
      select: { id: true, name: true, idCard: true, phone: true, gender: true },
    });

    return NextResponse.json(success(profile), { status: 201 });
  } catch (error) {
    console.error("Create patient-profile error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
