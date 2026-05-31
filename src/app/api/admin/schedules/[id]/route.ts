import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { success } from "@/lib/utils/response";
import { apiHandler } from "@/lib/utils/api-handler";
import { NotFoundError } from "@/lib/utils/errors";
import type { Prisma } from "@generated/prisma/client";

export const GET = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const prisma = await getPrisma();
  const schedule = await prisma.schedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new NotFoundError("排班记录不存在");
  }

  return NextResponse.json(success(schedule));
}, { requireAdmin: true });

export const PUT = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const body = await req.json();
  const { date, timeSlot, quota, type } = body;

  const prisma = await getPrisma();

  const existing = await prisma.schedule.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError("排班记录不存在");
  }

  const updateData: Partial<Prisma.ScheduleUpdateInput> = {};
  if (date !== undefined) updateData.date = date;
  if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
  if (quota !== undefined) updateData.quota = parseInt(quota);
  if (type !== undefined) updateData.type = type;

  const schedule = await prisma.schedule.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(success(schedule));
}, { requireAdmin: true });

export const DELETE = apiHandler<{ id: string }>(async (req, { params }) => {
  const { id } = await params;

  const prisma = await getPrisma();

  const existing = await prisma.schedule.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new NotFoundError("排班记录不存在");
  }

  await prisma.schedule.delete({
    where: { id },
  });

  return NextResponse.json(success(null, "删除成功"));
}, { requireAdmin: true });
