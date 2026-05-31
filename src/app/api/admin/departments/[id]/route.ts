import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { NotFoundError } from "@/lib/utils/errors";

export const GET = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const prisma = await getPrisma();
  const department = await prisma.department.findUnique({
    where: { id },
  });

  if (!department) {
    throw new NotFoundError("科室不存在");
  }

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
