import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { NotFoundError } from "@/shared/utils/errors";
// eslint-disable-next-line no-restricted-imports
import { getDepartmentById } from "@/features/hospital/queries";

export const GET = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const department = await getDepartmentById(id);
  return NextResponse.json(success(department));
}, { requireAdmin: true });

export const PUT = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const body = await req.json();
  const { name, description } = body;

  const prisma = await getPrisma();

  const existing = await prisma.department.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError("科室不存在");
  }

  const department = await prisma.department.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  });

  return NextResponse.json(success(department));
}, { requireAdmin: true });

export const DELETE = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const prisma = await getPrisma();

  const existing = await prisma.department.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError("科室不存在");
  }

  await prisma.department.delete({
    where: { id },
  });

  return NextResponse.json(success(null, "删除成功"));
}, { requireAdmin: true });
