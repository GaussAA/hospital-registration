import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { paginationSchema } from "@/lib/validations/common.schema";

export const GET = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => { raw[key] = value; });
  const query = paginationSchema.parse(raw);

  const prisma = await getPrisma();

  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });
  if (!doctor) {
    throw new NotFoundError("医生不存在");
  }

  const [list, total] = await Promise.all([
    prisma.schedule.findMany({
      where: { doctorId: id },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
    }),
    prisma.schedule.count({ where: { doctorId: id } }),
  ]);

  return NextResponse.json(success({ list, total, page: query.page, pageSize: query.pageSize }));
}, { requireAdmin: true });

export const POST = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const body = await req.json();
  const { date, timeSlot, quota, type } = body;

  if (!date || !timeSlot || quota === undefined) {
    throw new ValidationError("缺少必要字段");
  }

  const prisma = await getPrisma();

  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });
  if (!doctor) {
    throw new NotFoundError("医生不存在");
  }

  const schedule = await prisma.schedule.create({
    data: {
      doctorId: id,
      date,
      timeSlot,
      quota: parseInt(quota) || 30,
      bookedCount: 0,
      type: type || "normal",
    },
  });

  return NextResponse.json(success(schedule), { status: 201 });
}, { requireAdmin: true });
