import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { verifyToken } from "@/lib/utils/jwt";
import { success, fail } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw new Error("未认证");
  const payload = verifyToken(token);
  if (payload.role !== "admin") throw new Error("权限不足");
  return payload;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin(request);
    const { id } = await props.params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const prisma = await getPrisma();

    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });
    if (!doctor) {
      throw new NotFoundError("医生不存在");
    }

    const [list, total] = await Promise.all([
      prisma.schedule.findMany({
        where: { doctorId: id },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
      }),
      prisma.schedule.count({ where: { doctorId: id } }),
    ]);

    return NextResponse.json(success({ list, total, page, pageSize }));
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json(fail(err.statusCode, err.message), {
        status: err.statusCode,
      });
    }
    const msg = err instanceof Error ? err.message : "服务器错误";
    if (msg === "未认证" || msg === "权限不足") {
      return NextResponse.json(fail(401, msg), { status: 401 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin(request);
    const { id } = await props.params;

    const body = await request.json();
    const { date, timeSlot, quota, type } = body;

    if (!date || !timeSlot || quota === undefined) {
      return NextResponse.json(fail(400, "缺少必要字段"), { status: 400 });
    }

    const prisma = await getPrisma();

    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });
    if (!doctor) {
      throw new NotFoundError("医生不存在");
    }

    const schedule = await prisma.schedule.create({
      data: {
        doctorId: id,
        date,
        timeSlot,
        quota: parseInt(quota) || 30,
        bookedCount: 0,
        type: type || "normal",
      },
    });

    return NextResponse.json(success(schedule), { status: 201 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json(fail(err.statusCode, err.message), {
        status: err.statusCode,
      });
    }
    const msg = err instanceof Error ? err.message : "服务器错误";
    if (msg === "未认证" || msg === "权限不足") {
      return NextResponse.json(fail(401, msg), { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.code === "P2002") {
      return NextResponse.json(fail(409, "该时段排班已存在"), { status: 409 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}
