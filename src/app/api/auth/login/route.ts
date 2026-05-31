import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { comparePassword } from "@/lib/utils/password";
import { signToken } from "@/lib/utils/jwt";
import { apiHandler } from "@/lib/utils/api-handler";
import { success, fail } from "@/lib/utils/response";
import { SESSION_EXPIRY_SECONDS } from "@/lib/constants";

export const POST = apiHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { account, password } = body;

  if (!account || !password) {
    return NextResponse.json(fail(40001, "请填写账号和密码"), { status: 400 });
  }

  const prisma = await getPrisma();

  // 查找用户 — account 可以是 email 或 phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: account }, { phone: account }],
    },
    select: { id: true, name: true, email: true, phone: true, role: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json(fail(40100, "账号或密码错误"), { status: 401 });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(fail(40100, "账号或密码错误"), { status: 401 });
  }

  const token = signToken({ userId: user.id, role: user.role });
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  const response = NextResponse.json(success({ user: safeUser }), { status: 200 });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_SECONDS,
  });
  return response;
});
