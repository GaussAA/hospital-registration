import { NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { apiHandler } from "@/shared/utils/api-handler";
import { success, fail } from "@/shared/utils/response";

/**
 * GET /api/auth/me
 * Return current user info based on token cookie.
 * Used by UserProvider on the client side to hydrate auth state.
 */
export const GET = apiHandler(async (_req, { user }) => {
  const prisma = await getPrisma();
  const currentUser = await prisma.user.findUnique({
    where: { id: user!.userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!currentUser) {
    return NextResponse.json(fail(40100, "用户不存在"), { status: 401 });
  }

  return NextResponse.json(success(currentUser));
}, { requireAuth: true });
