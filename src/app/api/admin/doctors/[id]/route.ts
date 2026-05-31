import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { NotFoundError } from "@/lib/utils/errors";
import type { Prisma } from "../../../../../../generated/prisma/client";

export const GET = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const prisma = await getPrisma();
  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor) {
    throw new NotFoundError("医生不存在");
  }

  return NextResponse.json(success(doctor));
}, { requireAdmin: true });

export const PUT = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const body = await req.json();
  const { name, title, specialty, introduction, departmentId } = body;

  const prisma = await getPrisma();

  const existing = await prisma.doctor.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError("医生不存在");
  }

  const updateData: Partial<Prisma.DoctorUpdateInput> = {};
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
    (updateData as Record<string, unknown>).departmentId = departmentId;
    (updateData as Record<string, unknown>).hospitalId = department.hospitalId;
  }

  const doctor = await prisma.doctor.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(success(doctor));
}, { requireAdmin: true });

export const DELETE = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

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
}, { requireAdmin: true });
