import { NextRequest, NextResponse } from "next/server";
import { ConversationStore } from "@/lib/ai/conversation-store";
import { success, fail } from "@/lib/utils/response";

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
