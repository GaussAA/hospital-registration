import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";
import { processMessage } from "@/lib/ai/agent";
import { success, fail } from "@/lib/utils/response";
import type { ChatMessage } from "@/lib/ai/types";

/**
 * POST /api/chat — Send a message to the AI registration assistant.
 *
 * Body:
 *   { message: string, history: { role, content }[] }
 *
 * Response:
 *   { code: 0, data: { reply: string }, message: "ok" }
 */
export async function POST(req: NextRequest) {
  try {
    // ── Parse body ──
    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== "string") {
      return NextResponse.json(fail(40001, "请提供消息内容"), { status: 400 });
    }

    const message = body.message.trim();
    if (!message) {
      return NextResponse.json(fail(40001, "消息内容不能为空"), { status: 400 });
    }

    // ── Auth — try to extract user from token if present ──
    const token = req.cookies.get("token")?.value;
    let userId: string | undefined;
    let userRole: string | undefined;

    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
        userRole = payload.role;
      } catch {
        // Token invalid — that's fine, treat as anonymous
      }
    }

    // ── Validate history format ──
    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history.filter(
          (m: unknown) =>
            m &&
            typeof m === "object" &&
            ["user", "assistant", "system"].includes(m.role) &&
            typeof m.content === "string"
        )
      : [];

    // ── Process through AI agent ──
    const result = await processMessage(message, history, {
      userId,
      userRole,
    });

    return NextResponse.json(success({ reply: result.reply }));
  } catch (error) {
    console.error("[Chat API Error]", error);
    return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
  }
}
