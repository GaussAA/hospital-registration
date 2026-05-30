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
  props: { params: Promise<{ hospitalId: string }> }
) {
  try {
    await checkAdmin(request);
    const { hospitalId } = await props.params;

    const prisma = await getPrisma();
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new NotFoundError("医院不存在");
    }

    return NextResponse.json(success(hospital));
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

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ hospitalId: string }> }
) {
  try {
    await checkAdmin(request);
    const { hospitalId } = await props.params;

    const body = await request.json();
    const { name, city, level, phone, address, description } = body;

    const prisma = await getPrisma();

    const existing = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (!existing) {
      throw new NotFoundError("医院不存在");
    }

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(name !== undefined && { name }),
        ...(city !== undefined && { city }),
        ...(level !== undefined && { level }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(success(hospital));
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

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ hospitalId: string }> }
) {
  try {
    await checkAdmin(request);
    const { hospitalId } = await props.params;

    const prisma = await getPrisma();

    const existing = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (!existing) {
      throw new NotFoundError("医院不存在");
    }

    await prisma.hospital.delete({
      where: { id: hospitalId },
    });

    return NextResponse.json(success(null, "删除成功"));
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
