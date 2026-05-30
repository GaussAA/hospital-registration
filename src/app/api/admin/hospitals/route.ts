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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const prisma = await getPrisma();

    const [list, total] = await Promise.all([
      prisma.hospital.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.hospital.count(),
    ]);

    return NextResponse.json(success({ list, total, page, pageSize }));
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("服务器错误");
    if (error.message === "未认证" || error.message === "权限不足") {
      return NextResponse.json(fail(401, error.message), { status: 401 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await checkAdmin(request);

    const body = await request.json();
    const { name, city, level, phone, address, description } = body;

    if (!name || !city || !phone || !address) {
      return NextResponse.json(fail(400, "缺少必要字段"), { status: 400 });
    }

    const prisma = await getPrisma();

    const hospital = await prisma.hospital.create({
      data: {
        name,
        city,
        level: level || "三甲",
        phone,
        address,
        description: description || "",
      },
    });

    return NextResponse.json(success(hospital), { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("服务器错误");
    if (error.message === "未认证" || error.message === "权限不足") {
      return NextResponse.json(fail(401, error.message), { status: 401 });
    }
    return NextResponse.json(fail(500, "服务器错误"), { status: 500 });
  }
}
