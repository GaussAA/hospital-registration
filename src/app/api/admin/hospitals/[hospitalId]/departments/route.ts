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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const prisma = await getPrisma();

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (!hospital) {
      throw new NotFoundError("医院不存在");
    }

    const [list, total] = await Promise.all([
      prisma.department.findMany({
        where: { hospitalId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.department.count({ where: { hospitalId } }),
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
  props: { params: Promise<{ hospitalId: string }> }
) {
  try {
    await checkAdmin(request);
    const { hospitalId } = await props.params;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(fail(400, "科室名称不能为空"), {
        status: 400,
      });
    }

    const prisma = await getPrisma();

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });
    if (!hospital) {
      throw new NotFoundError("医院不存在");
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || "",
        hospitalId,
      },
    });

    return NextResponse.json(success(department), { status: 201 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json(fail(err.statusCode, err.message), {
        status: err.statusCode,
      });
    }
    const msg2 = err instanceof Error ? err.message : "服务器错误";
    if (msg2 === "未认证" || msg2 === "权限不足") {
      return NextResponse.json(fail(401, msg2), { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.code === "P2002") {
      return NextResponse.json(fail(409, "该科室名称已存在"), { status: 409 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}
