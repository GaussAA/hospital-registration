import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { NotFoundError } from "@/shared/utils/errors";
import { getDoctorById } from "@/features/hospital";

export const GET = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const doctor = await getDoctorById(id);
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

  const updateData: Record<string, unknown> = {};
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
