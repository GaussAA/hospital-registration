import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { hashPassword } from "@/lib/utils/password";
import { signToken } from "@/lib/utils/jwt";
import { success, fail } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      maxAge: 7 * 24 * 60 * 60,
    });
    // 非 httpOnly cookie，供前端 JS 读取登录态
    response.cookies.set("user_info", JSON.stringify({ name: user.name, role: user.role }), {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
