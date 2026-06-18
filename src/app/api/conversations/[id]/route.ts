import { NextRequest, NextResponse } from "next/server";
import { ConversationStore } from "@/features/chat";
import { success, fail } from "@/shared/utils/response";

/**
 * GET /api/conversations/[id]
 *
 * Get conversation detail with all messages.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await ConversationStore.getDetail(id);

    if (!detail) {
      return NextResponse.json(fail(40400, "对话不存在"), { status: 404 });
    }

    return NextResponse.json(success(detail));
  } catch (error) {
    console.error("[conversations/id] Error:", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}

/**
 * DELETE /api/conversations/[id]
 *
 * Delete a conversation.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ConversationStore.remove(id);
    return NextResponse.json(success(null, "对话已删除"));
  } catch (error) {
    console.error("[conversations/id] Delete error:", error);
    return NextResponse.json(fail(50000, "删除失败"), { status: 500 });
  }
}
