import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/shared/db";
import { hashPassword } from "@/shared/utils/password";
import { signToken } from "@/shared/utils/jwt";
import { apiHandler } from "@/shared/utils/api-handler";
import { success, fail } from "@/shared/utils/response";
import { SESSION_EXPIRY_SECONDS } from "@/shared/utils/constants";

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { name, email, phone, password } = body;

  // 验证
  if (!name || !password || (!email && !phone)) {
    return NextResponse.json(fail(40001, "请填写完整信息"), { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(fail(40001, "密码至少 6 位"), { status: 400 });
  }

  const prisma = await getPrisma();

  // 检查重复
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json(fail(40001, "邮箱已被注册"), { status: 400 });
  }
  if (phone) {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing)
      return NextResponse.json(fail(40001, "手机号已被注册"), { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: "patient" },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  const token = signToken({ userId: user.id, role: user.role });
  const response = NextResponse.json(success({ user }), { status: 201 });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_SECONDS,
  });
  return response;
});
