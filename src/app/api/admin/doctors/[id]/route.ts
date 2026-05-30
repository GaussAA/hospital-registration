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
    const doctor = await prisma.doctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundError("医生不存在");
    }

    return NextResponse.json(success(doctor));
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
  props: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin(request);
    const { id } = await props.params;

    const body = await request.json();
    const { name, title, specialty, introduction, departmentId } = body;

    const prisma = await getPrisma();

    const existing = await prisma.doctor.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundError("医生不存在");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (introduction !== undefined) updateData.introduction = introduction;

    // If department changes, also update hospitalId
    if (departmentId !== undefined && departmentId !== existing.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        throw new NotFoundError("科室不存在");
      }
      updateData.departmentId = departmentId;
      updateData.hospitalId = department.hospitalId;
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(success(doctor));
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
  props: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdmin(request);
    const { id } = await props.params;

    const prisma = await getPrisma();

    const existing = await prisma.doctor.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundError("医生不存在");
    }

    await prisma.doctor.delete({
      where: { id },
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
