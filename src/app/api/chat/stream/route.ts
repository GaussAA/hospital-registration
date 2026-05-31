import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";
import { ConversationStore } from "@/lib/ai/conversation-store";
import { createStreamResponse } from "@/lib/ai/stream-agent";
import type { ToolContext } from "@/lib/ai/types";

/**
 * POST /api/chat/stream — SSE streaming chat endpoint.
 *
 * Uses direct DeepSeek Chat Completions API with streaming + tool calling.
 * Messages are persisted to the database on stream completion.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const body = await req.json();
    const { message, conversationId: existingConvId } = body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "消息不能为空" }), { status: 400 });
    }

    // 2. Get or create session ID
    const sessionId = req.headers.get("x-session-id") || crypto.randomUUID();

    // 3. Parse JWT token (optional)
    const token = req.cookies.get("token")?.value;
    let userId: string | undefined;
    let userRole: string | undefined;
    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
        userRole = payload.role;
      } catch {
        // Token invalid — treat as anonymous
      }
    }

    // 4. Get or create conversation
    const conversationId = existingConvId || (await ConversationStore.getOrCreate(sessionId, userId));

    // 5. Save user message immediately, capture its ID for feedback
    const userMessageId = await ConversationStore.addMessage(conversationId, "user", message.trim());

    // 6. Load recent history (last 30 messages)
    const detail = await ConversationStore.getDetail(conversationId);
    const history = (detail?.messages || [])
      .slice(-30)
      .map((m) => ({
        role: m.role,
        content: m.content || "",
      }));

    // 7. Build ToolContext
    const context: ToolContext = { userId, userRole };

    // 8. Create streaming response (returns ReadableStream directly)
    const aiStream = await createStreamResponse(
      [...history, { role: "user", content: message.trim() }],
      context
    );

    // 9. Pipe through a wrapper that persists messages on completion
    const encoder = new TextEncoder();
    const fullContent: string[] = [];
    const wrappedStream = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Collect text chunks for persistence
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (line.startsWith("0:")) {
                try {
                  const text = JSON.parse(line.slice(2));
                  fullContent.push(text);
                } catch {}
              }
            }

            controller.enqueue(value);
          }

          // 10. Persist AI response on completion
          const content = fullContent.join("");
          let assistantMessageId: string | undefined;

          if (content.trim()) {
            // Save assistant message and get ID
            assistantMessageId = await ConversationStore.addMessage(
              conversationId,
              "assistant",
              content
            );

            // Auto-generate smart title from first user message
            if (detail && detail.title === "新对话") {
              const title = ConversationStore.generateSmartTitle(message.trim());
              await ConversationStore.updateTitle(conversationId, title);
            }
          }

          // 11. Send finish event with IDs for feedback
          controller.enqueue(
            encoder.encode(
              `d:${JSON.stringify({
                conversationId,
                userMessageId,
                assistantMessageId: assistantMessageId || null,
              })}\n\n`
            )
          );
        } catch (err: any) {
          console.error("[chat/stream] Stream error:", err);
        } finally {
          try { controller.close(); } catch {}
        }
      },
    });

    return new Response(wrappedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-conversation-id": conversationId,
      },
    });
  } catch (error: any) {
    console.error("[chat/stream] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "内部错误" }), {
      status: 500,
    });
  }
}
