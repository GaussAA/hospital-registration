import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { NotFoundError } from "@/shared/utils/errors";
import { getHospitalById } from "@/features/hospital/queries";

export const GET = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;
  const hospital = await getHospitalById(hospitalId);
  return NextResponse.json(success(hospital));
}, { requireAdmin: true });

export const PUT = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;

  const body = await req.json();
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
}, { requireAdmin: true });

export const DELETE = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;

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
}, { requireAdmin: true });
