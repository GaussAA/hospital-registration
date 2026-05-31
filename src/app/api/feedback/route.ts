import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { verifyToken } from "@/lib/utils/jwt";
import { success, fail } from "@/lib/utils/response";

/**
 * POST /api/feedback — 提交消息反馈（有帮助/没帮助）。
 *
 * Body: { messageId: string, rating: "helpful" | "not_helpful" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.messageId || !body.rating) {
      return NextResponse.json(fail(40001, "缺少 messageId 或 rating"), { status: 400 });
    }

    if (!["helpful", "not_helpful"].includes(body.rating)) {
      return NextResponse.json(fail(40002, "rating 只能为 helpful 或 not_helpful"), { status: 400 });
    }

    // 获取用户 ID（必须登录）
    const token = req.cookies.get("token")?.value;
    let userId: string;
    try {
      const payload = verifyToken(token!);
      userId = payload.userId;
    } catch {
      return NextResponse.json(fail(40100, "请先登录后再提交反馈"), { status: 401 });
    }

    const prisma = await getPrisma();

    // upsert：同一用户对同一条消息只能有一个反馈
    await (prisma as any).messageFeedback.upsert({
      where: {
        messageId_userId: {
          messageId: body.messageId,
          userId,
        },
      },
      update: {
        rating: body.rating,
      },
      create: {
        messageId: body.messageId,
        userId,
        rating: body.rating,
      },
    });

    return NextResponse.json(success(null, "感谢您的反馈"));
  } catch (error) {
    console.error("[feedback] Error:", error);
    return NextResponse.json(fail(50000, "反馈提交失败"), { status: 500 });
  }
}
