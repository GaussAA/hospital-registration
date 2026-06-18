import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/shared/utils/jwt";
import { ConversationStore } from "@/features/chat";
import { success, fail } from "@/shared/utils/response";

/**
 * GET /api/conversations?sessionId=xxx&userId=xxx
 *
 * List all conversations for a session (optionally filtered by userId).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    if (!sessionId) {
      return NextResponse.json(fail(40001, "缺少 sessionId"), { status: 400 });
    }

    const conversations = await ConversationStore.list(
      sessionId,
      userId || undefined
    );
    return NextResponse.json(success(conversations));
  } catch (error) {
    console.error("[conversations] Error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}

/**
 * POST /api/conversations
 *
 * Create a new conversation explicitly (used by "new conversation" action).
 * Body: { sessionId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId || req.headers.get("x-session-id") || crypto.randomUUID();

    const token = req.cookies.get("token")?.value;
    let userId: string | undefined;
    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
      } catch {
        // Anonymous
      }
    }

    const conversationId = await ConversationStore.create(sessionId, userId);
    return NextResponse.json(success({ id: conversationId }));
  } catch (error) {
    console.error("[conversations POST] Error:", error);
    return NextResponse.json(fail(50000, "创建对话失败"), { status: 500 });
  }
}
