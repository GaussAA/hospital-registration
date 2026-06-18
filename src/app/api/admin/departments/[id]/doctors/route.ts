import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { success } from "@/shared/utils/response";
import { apiHandler } from "@/shared/utils/api-handler";
import { NotFoundError, ValidationError } from "@/shared/utils/errors";
import { paginationSchema } from "@/shared/utils/common-schema";

export const GET = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => { raw[key] = value; });
  const query = paginationSchema.parse(raw);

  const prisma = await getPrisma();

  const department = await prisma.department.findUnique({
    where: { id },
    include: { hospital: true },
  });
  if (!department) {
    throw new NotFoundError("科室不存在");
  }

  const [list, total] = await Promise.all([
    prisma.doctor.findMany({
      where: { departmentId: id },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.doctor.count({ where: { departmentId: id } }),
  ]);

  return NextResponse.json(success({ list, total, page: query.page, pageSize: query.pageSize }));
}, { requireAdmin: true });

export const POST = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const body = await req.json();
  const { name, title, specialty, introduction } = body;

  if (!name || !specialty) {
    throw new ValidationError("缺少必要字段");
  }

  const prisma = await getPrisma();

  const department = await prisma.department.findUnique({
    where: { id },
    include: { hospital: true },
  });
  if (!department) {
    throw new NotFoundError("科室不存在");
  }

  const doctor = await prisma.doctor.create({
    data: {
      name,
      title: title || "主治医师",
      specialty,
      introduction: introduction || "",
      departmentId: id,
      hospitalId: department.hospitalId,
    },
  });

  return NextResponse.json(success(doctor), { status: 201 });
}, { requireAdmin: true });
