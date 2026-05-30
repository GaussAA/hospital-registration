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

    const prisma = await getPrisma();
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundError("排班记录不存在");
    }

    return NextResponse.json(success(schedule));
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json(fail(err.statusCode, err.message), {
        status: err.statusCode,
      });
    }
    if (err instanceof Error && (err.message === "未认证" || err.message === "权限不足")) {
      return NextResponse.json(fail(401, err.message), { status: 401 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin(request);
    const { id } = await props.params;

    const body = await request.json();
    const { date, timeSlot, quota, type } = body;

    const prisma = await getPrisma();

    const existing = await prisma.schedule.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundError("排班记录不存在");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (date !== undefined) updateData.date = date;
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
    if (quota !== undefined) updateData.quota = parseInt(quota);
    if (type !== undefined) updateData.type = type;

    const schedule = await prisma.schedule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(success(schedule));
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

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin(request);
    const { id } = await props.params;

    const prisma = await getPrisma();

    const existing = await prisma.schedule.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundError("排班记录不存在");
    }

    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json(success(null, "删除成功"));
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json(fail(err.statusCode, err.message), {
        status: err.statusCode,
      });
    }
    if (err instanceof Error && (err.message === "未认证" || err.message === "权限不足")) {
      return NextResponse.json(fail(401, err.message), { status: 401 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}
