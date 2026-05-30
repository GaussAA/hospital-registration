import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { comparePassword } from "@/lib/utils/password";
import { signToken } from "@/lib/utils/jwt";
import { success, fail } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      maxAge: 7 * 24 * 60 * 60,
    });
    // 非 httpOnly cookie，供前端 JS 读取登录态
    response.cookies.set("user_info", JSON.stringify({ name: safeUser.name, role: safeUser.role }), {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
