import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";
import { ConversationStore } from "@/lib/ai/conversation-store";
import { createStreamResponse } from "@/lib/ai/stream-agent";
import type { ToolContext } from "@/lib/ai/types";

/**
 * POST /api/chat/stream — SSE streaming chat endpoint.
 *
 * Uses direct DeepSeek Chat Completions API with streaming + tool calling.
 * Messages are persisted to the database on stream completion,
 * including tool call chains for context preservation across conversations.
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

    // 3. Parse JWT token (optional) — dual authentication:
    //    Primary: cookie-based JWT (httpOnly security)
    //    Fallback: userId from request body (from useUser context)
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

    // Fallback: if cookie auth failed but client provided userId from auth context
    if (!userId && bodyUserId && typeof bodyUserId === "string") {
      userId = bodyUserId;
    }

    // Log auth status for diagnostics (no personal info)
    console.log(`[chat/stream] session=${sessionId.slice(0,8)}... auth=${!!userId}`);

    // 4. Get or create conversation
    //    If existingConvId is provided (from a "new conversation" action or existing),
    //    use it directly. Otherwise, create a brand new conversation.
    let conversationId: string;
    if (existingConvId) {
      conversationId = existingConvId;
    } else {
      // When no conversationId provided, always create new (not getOrCreate)
      conversationId = await ConversationStore.create(sessionId, userId);
    }

    // 5. Save user message immediately, capture its ID for feedback
    const userMessageId = await ConversationStore.addMessage(
      conversationId,
      "user",
      message.trim()
    );

    // 6. Load recent history with full tool call reconstruction
    const history = await ConversationStore.loadHistoryAsChatMessages(
      conversationId,
      40 // Max messages to load
    );

    // 7. Build ToolContext
    const context: ToolContext = { userId, userRole };

    // 8. Create streaming response — pass full ChatMessage[] so tool_calls and tool_call_id are preserved
    const aiStream = await createStreamResponse(
      [...history, { role: "user", content: message.trim() }],
      context
    );

    // 9. Pipe through a wrapper that persists messages and tool calls on completion
    const encoder = new TextEncoder();
    const fullContent: string[] = [];
    const toolMessagesToPersist: Array<{ role: string; content: string | null; toolCalls?: string }> = [];
    let titleUpdated = false;

    const wrappedStream = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Collect text chunks and tool messages for persistence
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (line.startsWith("0:")) {
                try {
                  const text = JSON.parse(line.slice(2));
                  fullContent.push(text);
                } catch {
                  // Ignore parse errors on text chunks
                }
              } else if (line.startsWith("e:tool-messages:")) {
                // Capture complete tool call chain for persistence
                try {
                  const dataStr = line.slice("e:tool-messages:".length).trim();
                  const data = JSON.parse(dataStr);
                  if (data.messages && Array.isArray(data.messages)) {
                    toolMessagesToPersist.push(
                      ...data.messages.map(
                        (m: { role: string; content: string | null; toolCalls?: string }) => ({
                          role: m.role,
                          content: m.content ?? null,
                          toolCalls: m.toolCalls || undefined,
                        })
                      )
                    );
                  }
                } catch {
                  // Ignore parse errors on tool-messages
                }
              }
            }

            controller.enqueue(value);
          }

          // 10. Persist AI response and tool messages on completion
          const content = fullContent.join("");
          let assistantMessageId: string | undefined;

          if (content.trim()) {
            // Save assistant message with toolCalls (if any)
            const assistantToolCalls = toolMessagesToPersist
              .filter((m) => m.role === "assistant" && m.toolCalls)
              .map((m) => m.toolCalls);

            assistantMessageId = await ConversationStore.addMessage(
              conversationId,
              "assistant",
              content,
              assistantToolCalls.length > 0
                ? assistantToolCalls[assistantToolCalls.length - 1]
                : undefined
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
          }

          // 11. Persist tool messages (tool results) after the assistant message
          const toolResultMessages = toolMessagesToPersist.filter((m) => m.role === "tool");
          if (toolResultMessages.length > 0) {
            await ConversationStore.addMessages(conversationId, toolResultMessages);
          }

          // 12. Send finish event with IDs for feedback
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
  } catch (error: any) {
    console.error("[chat/stream] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "内部错误" }), {
      status: 500,
    });
  }
}
