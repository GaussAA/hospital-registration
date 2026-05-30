import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { verifyToken } from "@/lib/utils/jwt";
import { success, fail } from "@/lib/utils/response";

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw new Error("未认证");
  const payload = verifyToken(token);
  if (payload.role !== "admin") throw new Error("权限不足");
  return payload;
}

export async function GET(request: NextRequest) {
  try {
    await checkAdmin(request);

    const prisma = await getPrisma();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const [todayAppointments, totalHospitals, totalDoctors] =
      await Promise.all([
        prisma.registration.count({
          where: { date: todayStr },
        }),
        prisma.hospital.count(),
        prisma.doctor.count(),
      ]);

    return NextResponse.json(
      success({ todayAppointments, totalHospitals, totalDoctors })
    );
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === "未认证" || err.message === "权限不足")) {
      return NextResponse.json(fail(401, err.message), { status: 401 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}
