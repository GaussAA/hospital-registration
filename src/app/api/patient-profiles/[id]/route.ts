import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { apiHandler } from "@/shared/utils/api-handler";
import { success, fail } from "@/shared/utils/response";
import { NotFoundError } from "@/shared/utils/errors";

export const GET = apiHandler<{ id: string }>(
  async (_req, { params, user }) => {
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

    // Build safe response without userId
    return NextResponse.json(
      success({
        profile: {
          id: profile.id,
          name: profile.name,
          idCard: profile.idCard,
          phone: profile.phone,
          gender: profile.gender,
        },
      }),
    );
  },
  { requireAuth: true },
);
