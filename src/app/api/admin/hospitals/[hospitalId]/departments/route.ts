import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { paginationSchema } from "@/lib/validations/common.schema";

export const GET = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;

  const { searchParams } = new URL(req.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => { raw[key] = value; });
  const query = paginationSchema.parse(raw);

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
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.department.count({ where: { hospitalId } }),
  ]);

  return NextResponse.json(success({ list, total, page: query.page, pageSize: query.pageSize }));
}, { requireAdmin: true });

export const POST = apiHandler<{ hospitalId: string }>(async (req, { params }) => {
  const { hospitalId } = await params;

  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    throw new ValidationError("科室名称不能为空");
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
}, { requireAdmin: true });
