import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { apiHandler } from "@/lib/utils/api-handler";
import { success, fail } from "@/lib/utils/response";
import { NotFoundError } from "@/lib/utils/errors";

export const GET = apiHandler<{ id: string }>(async (_req, { params, user }) => {
  const { id } = await params;
  const prisma = await getPrisma();

  const profile = await prisma.patientProfile.findUnique({
    where: { id },
    select: { id: true, name: true, idCard: true, phone: true, gender: true, userId: true },
  });

  if (!profile) {
    throw new NotFoundError("就诊人不存在");
  }

  // Ownership check: only the owner can view their own profiles
  if (profile.userId !== user!.userId) {
    return NextResponse.json(fail(403, "无权访问该就诊人信息"), { status: 403 });
  }

  const { userId: _u, ...safeProfile } = profile;
  return NextResponse.json(success({ profile: safeProfile }));
}, { requireAuth: true });
