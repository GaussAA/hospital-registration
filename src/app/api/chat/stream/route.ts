import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";
import { ConversationStore } from "@/lib/ai/conversation-store";
import { ConversationPersistence } from "@/lib/ai/persistence";
import { createStreamResponse } from "@/lib/ai/stream-agent";
import type { ToolContext } from "@/lib/ai/types";

/**
 * POST /api/chat/stream — SSE streaming chat endpoint.
 *
 * Architecture:
 * 1. User message is persisted immediately (for feedback ID reference)
 * 2. createStreamResponse() returns { stream, result } where
 *    result = { content, reasoningContent, toolCalls[] }
 * 3. After the stream finishes, ConversationPersistence.saveAssistantResponse()
 *    persists the complete AI response + tool call chain in one call
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body
    const body = await req.json();
    const { message, conversationId: existingConvId, userId: bodyUserId } = body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "消息不能为空" }), { status: 400 });
    }

    // 2. Get or create session ID
    const sessionId = req.headers.get("x-session-id") || crypto.randomUUID();

    // 3. Parse JWT token (optional) — dual authentication
    const token = req.cookies.get("token")?.value;
    let userId: string | undefined;
    let userRole: string | undefined;
    if (token) {
      try {
        const payload = verifyToken(token);
        userId = payload.userId;
        userRole = payload.role;
      } catch {
        // Token invalid — fall through to body fallback
      }
    }
    if (!userId && bodyUserId && typeof bodyUserId === "string") {
      userId = bodyUserId;
    }

    console.log(`[chat/stream] session=${sessionId.slice(0,8)}... auth=${!!userId}`);

    // 4. Get or create conversation
    let conversationId: string;
    if (existingConvId) {
      conversationId = existingConvId;
    } else {
      conversationId = await ConversationStore.create(sessionId, userId);
    }

    // 5. Save user message immediately (for feedback ID reference)
    const userMessageId = await ConversationStore.addMessage(
      conversationId,
      "user",
      message.trim()
    );

    // 6. Load recent history
    const history = await ConversationStore.loadHistoryAsChatMessages(conversationId, 40);

    // 7. Build ToolContext
    const context: ToolContext = { userId, userRole };

    // 8. Create streaming response — returns { stream, promise } where
    //    stream is the real-time SSE stream, promise resolves with AgentResult
    const { stream: aiStream, promise: agentPromise } = await createStreamResponse(
      [...history, { role: "user", content: message.trim() }],
      context
    );

    // 9. Pipe through a wrapper that persists data after stream ends
    const encoder = new TextEncoder();
    let titleUpdated = false;

    const wrappedStream = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader();

        try {
          // Forward all stream data as-is (no interception needed)
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }

          // 10. Wait for agent loop to complete, then persist assistant response + tool calls
          const agentResult = await agentPromise;

          if (agentResult.content.trim() || agentResult.toolCalls.length > 0) {
            const toolCallInputs = agentResult.toolCalls.map((tc) => ({
              toolName: tc.name,
              arguments: tc.arguments,
              result: tc.result,
              status: tc.status,
            }));

            const assistantMessageId = await ConversationPersistence.saveAssistantResponse(
              conversationId,
              {
                content: agentResult.content,
                reasoningContent: agentResult.reasoningContent,
              },
              toolCallInputs
            );

            // Auto-generate smart title from first user message
            if (!titleUpdated) {
              const detail = await ConversationStore.getDetail(conversationId).catch(() => null);
              if (detail && detail.title === "新对话") {
                const title = ConversationStore.generateSmartTitle(message.trim());
                await ConversationStore.updateTitle(conversationId, title);
                titleUpdated = true;
              }
            }

            // Send finish event with IDs for feedback
            controller.enqueue(
              encoder.encode(
                `d:${JSON.stringify({
                  conversationId,
                  userMessageId,
                  assistantMessageId,
                })}\n\n`
              )
            );
          } else {
            // No content and no tool calls — send finish with null assistant ID
            controller.enqueue(
              encoder.encode(
                `d:${JSON.stringify({
                  conversationId,
                  userMessageId,
                  assistantMessageId: null,
                })}\n\n`
              )
            );
          }
        } catch (err: unknown) {
          console.error("[chat/stream] Stream error:", err);
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed
          }
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
  } catch (error: unknown) {
    console.error("[chat/stream] Error:", error);
    const message = error instanceof Error ? error.message : "内部错误";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}
