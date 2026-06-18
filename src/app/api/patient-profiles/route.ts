import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { apiHandler } from "@/shared/utils/api-handler";
import { success, fail } from "@/shared/utils/response";

/**
 * GET /api/patient-profiles — 获取当前用户的所有就诊人
 */
export const GET = apiHandler(async (_req, { user }) => {
  const prisma = await getPrisma();
  const profiles = await prisma.patientProfile.findMany({
    where: { userId: user!.userId },
    select: { id: true, name: true, idCard: true, phone: true, gender: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(success(profiles), { status: 200 });
}, { requireAuth: true });

/**
 * POST /api/patient-profiles — 新增就诊人
 */
export const POST = apiHandler(async (req, { user }) => {
  const body = await req.json();
  const { name, idCard, phone, gender } = body;

  if (!name || !idCard || !phone || !gender) {
    return NextResponse.json(fail(40001, "请填写完整信息"), { status: 400 });
  }

  if (!["male", "female"].includes(gender)) {
    return NextResponse.json(fail(40001, "性别格式不正确"), { status: 400 });
  }

  const prisma = await getPrisma();
  const profile = await prisma.patientProfile.create({
    data: { userId: user!.userId, name, idCard, phone, gender },
    select: { id: true, name: true, idCard: true, phone: true, gender: true },
  });

  return NextResponse.json(success(profile), { status: 201 });
}, { requireAuth: true });
