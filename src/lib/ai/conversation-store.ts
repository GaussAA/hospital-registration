import { getPrisma } from "@/lib/db";
import type { ConversationSummary, ConversationDetail, ChatMessage, ToolCallInput } from "./types";

/**
 * Conversation persistence layer.
 * Manages conversation, message, and tool call records via Prisma.
 */
export class ConversationStore {
  /**
   * Create a new conversation and return its ID.
   */
  static async create(sessionId: string, userId?: string): Promise<string> {
    const prisma = await getPrisma();
    const conv = await prisma.conversation.create({
      data: {
        sessionId,
        userId: userId || null,
        title: "新对话",
      },
    });
    return conv.id;
  }

  /**
   * Find the most recent conversation for a session, or create one if none exists.
   */
  static async getOrCreate(sessionId: string, userId?: string): Promise<string> {
    const prisma = await getPrisma();
    const existing = await prisma.conversation.findFirst({
      where: { sessionId },
      orderBy: { updatedAt: "desc" },
    });
    if (existing) return existing.id;
    return this.create(sessionId, userId);
  }

  /**
   * Add a single message to a conversation, optionally with tool call records.
   * Automatically creates ToolCall records when toolCalls array is provided.
   */
  static async addMessage(
    conversationId: string,
    role: string,
    content: string | null,
    toolCalls?: ToolCallInput[],
    reasoningContent?: string
  ): Promise<string> {
    const prisma = await getPrisma();
    const msg = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        reasoningContent: reasoningContent || null,
        toolCalls: toolCalls
          ? {
              create: toolCalls.map((tc, idx) => ({
                sequence: idx,
                toolName: tc.toolName,
                arguments: tc.arguments,
                result: tc.result ?? null,
                status: tc.status ?? "pending",
              })),
            }
          : undefined,
      },
    });
    return msg.id;
  }

  /**
   * Batch add messages to a conversation.
   * Supports toolCalls as ToolCallInput[] for each message.
   */
  static async addMessages(
    conversationId: string,
    messages: Array<{
      role: string;
      content?: string | null;
      toolCalls?: ToolCallInput[];
      reasoningContent?: string;
    }>
  ): Promise<string[]> {
    const prisma = await getPrisma();
    const ids: string[] = [];

    for (const m of messages) {
      const msg = await prisma.message.create({
        data: {
          conversationId,
          role: m.role,
          content: m.content ?? null,
          reasoningContent: m.reasoningContent || null,
          toolCalls: m.toolCalls
            ? {
                create: m.toolCalls.map((tc, idx) => ({
                  sequence: idx,
                  toolName: tc.toolName,
                  arguments: tc.arguments,
                  result: tc.result ?? null,
                  status: tc.status ?? "pending",
                })),
              }
            : undefined,
        },
      });
      ids.push(msg.id);
    }

    return ids;
  }

  /**
   * Load conversation history as ChatMessage[] with tool calls reconstructed
   * from the ToolCall table.
   *
   * Backward compatibility:
   * - Messages with ToolCall records reconstruct tool_calls from the table.
   * - Messages without ToolCall records (old data) are kept as plain messages;
   *   the filtering logic drops incomplete tool rounds gracefully.
   */
  static async loadHistoryAsChatMessages(
    conversationId: string,
    maxMessages: number = 40
  ): Promise<ChatMessage[]> {
    const prisma = await getPrisma();
    const rawMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: maxMessages,
      include: {
        toolCalls: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    // Step 1: Reconstruct messages with tool call info and reasoning content
    const reconstructed: ChatMessage[] = rawMessages.map((m) => {
      const msg: ChatMessage = {
        role: m.role as ChatMessage["role"],
        content: m.content,
        reasoningContent: m.reasoningContent || undefined,
      };

      // Reconstruct tool_calls from ToolCall records for assistant messages
      if (m.role === "assistant" && m.toolCalls.length > 0) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.toolName,
            arguments: tc.arguments,
          },
        }));
      }

      // Reconstruct tool_call_id from ToolCall records for tool messages
      if (m.role === "tool" && m.toolCalls.length > 0) {
        // For tool messages, we use the first (and only) ToolCall's id as tool_call_id
        msg.tool_call_id = m.toolCalls[0].id;
      }

      return msg;
    });

    // Step 2: Filter out incomplete tool call rounds
    // (same logic as before — unchanged)
    const filtered: ChatMessage[] = [];
    let skipNextToolRound = false;

    for (let i = 0; i < reconstructed.length; i++) {
      const msg = reconstructed[i];

      if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
        let hasValidToolResults = true;
        let toolResultCount = 0;

        for (let j = i + 1; j < reconstructed.length && reconstructed[j].role === "tool"; j++) {
          toolResultCount++;
          if (!reconstructed[j].tool_call_id) {
            hasValidToolResults = false;
            break;
          }
        }

        if (hasValidToolResults && toolResultCount > 0) {
          filtered.push(msg);
        } else {
          skipNextToolRound = true;
        }
      } else if (msg.role === "tool") {
        if (!skipNextToolRound && msg.tool_call_id) {
          filtered.push(msg);
        }
        const nextMsg = reconstructed[i + 1];
        if (!nextMsg || nextMsg.role !== "tool") {
          skipNextToolRound = false;
        }
      } else {
        filtered.push(msg);
      }
    }

    return filtered;
  }

  /**
   * List conversation summaries for a session.
   */
  static async list(sessionId: string, userId?: string): Promise<ConversationSummary[]> {
    const prisma = await getPrisma();
    const conversations = await prisma.conversation.findMany({
      where: {
        sessionId,
        ...(userId ? { userId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
      },
    });
    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      messageCount: c._count.messages,
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Get conversation detail including all messages with tool call sub-records.
   */
  static async getDetail(conversationId: string): Promise<ConversationDetail | null> {
    const prisma = await getPrisma();
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            toolCalls: {
              orderBy: { sequence: "asc" },
            },
          },
        },
      },
    });
    if (!conv) return null;
    return {
      id: conv.id,
      title: conv.title,
      messages: conv.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: null, // Legacy field kept for compatibility
        reasoningContent: m.reasoningContent,
        createdAt: m.createdAt.toISOString(),
        toolCallRecords: m.toolCalls.map((tc) => ({
          id: tc.id,
          messageId: tc.messageId,
          sequence: tc.sequence,
          toolName: tc.toolName,
          arguments: tc.arguments,
          result: tc.result,
          status: tc.status,
          createdAt: tc.createdAt.toISOString(),
        })),
      })),
    };
  }

  /**
   * Update conversation title.
   */
  static async updateTitle(conversationId: string, title: string): Promise<void> {
    const prisma = await getPrisma();
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Generate a smart title from the first user message.
   * Uses heuristics: extracts hospital/department names, action verbs.
   */
  static generateSmartTitle(message: string): string {
    const cleaned = message.trim();
    if (!cleaned) return "新对话";

    let title = cleaned;
    const chars = Array.from(title);
    if (chars.length > 30) {
      title = chars.slice(0, 30).join("") + "…";
    }
    title = title.replace(/\s+/g, " ").trim();
    return title;
  }

  /**
   * Delete a conversation and all its messages (cascade handled by Prisma).
   */
  static async remove(conversationId: string): Promise<void> {
    const prisma = await getPrisma();
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Merge anonymous conversations into a user account after login.
   */
  static async mergeToUser(sessionId: string, userId: string): Promise<void> {
    if (!sessionId || !userId) return;

    const prisma = await getPrisma();
    const anonymousConversations = await prisma.conversation.findMany({
      where: { sessionId, userId: null },
    });

    if (anonymousConversations.length === 0) return;

    for (const conv of anonymousConversations) {
      const existingForUser = await prisma.conversation.findFirst({
        where: { userId, title: conv.title },
      });
      if (!existingForUser) {
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { userId },
        });
      }
    }
  }
}
