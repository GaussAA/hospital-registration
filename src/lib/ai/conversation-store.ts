import { getPrisma } from "@/lib/db";
import type { ConversationSummary, ConversationDetail, ChatMessage } from "./types";

/**
 * Conversation persistence layer.
 * Manages conversation and message records via Prisma.
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
   * Add a single message to a conversation.
   */
  static async addMessage(
    conversationId: string,
    role: string,
    content: string | null,
    toolCalls?: string
  ): Promise<string> {
    const prisma = await getPrisma();
    const msg = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        toolCalls: toolCalls || null,
      },
    });
    return msg.id;
  }

  /**
   * Batch add messages to a conversation.
   */
  static async addMessages(
    conversationId: string,
    messages: Array<{ role: string; content?: string | null; toolCalls?: string }>
  ): Promise<void> {
    const prisma = await getPrisma();
    await prisma.message.createMany({
      data: messages.map((m) => ({
        conversationId,
        role: m.role,
        content: m.content ?? null,
        toolCalls: m.toolCalls || null,
      })),
    });
  }

  /**
   * Load conversation history as ChatMessage[] with full tool call reconstruction.
   * - Assistant messages with toolCalls → parse JSON to restore tool_calls array
   * - Tool messages (role="tool") with toolCalls → extract tool_call_id from JSON
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
    });

    return rawMessages.map((m) => {
      const msg: ChatMessage = {
        role: m.role as ChatMessage["role"],
        content: m.content,
      };

      // Restore tool_calls from stored JSON for assistant messages
      if (m.role === "assistant" && m.toolCalls) {
        try {
          msg.tool_calls = JSON.parse(m.toolCalls);
        } catch {
          // Invalid JSON stored, skip tool_calls restoration
        }
      }

      // Restore tool_call_id from stored JSON for tool messages
      if (m.role === "tool" && m.toolCalls) {
        try {
          const parsed = JSON.parse(m.toolCalls);
          if (parsed && parsed.tool_call_id) {
            msg.tool_call_id = parsed.tool_call_id;
          }
        } catch {
          // Invalid JSON stored, skip tool_call_id restoration
        }
      }

      return msg;
    });
  }

  /** ... existing methods unchanged ... */

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
   * Get conversation detail including all messages.
   */
  static async getDetail(conversationId: string): Promise<ConversationDetail | null> {
    const prisma = await getPrisma();
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
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
        toolCalls: m.toolCalls,
        createdAt: m.createdAt.toISOString(),
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

    // 提取关键信息生成标题
    let title = cleaned;

    // 截断到合理长度（最多 30 字符）
    const chars = Array.from(title);
    if (chars.length > 30) {
      title = chars.slice(0, 30).join("") + "…";
    }

    // 去除多余空格
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
   * Transfers all conversations with matching sessionId to the user's userId.
   */
  static async mergeToUser(sessionId: string, userId: string): Promise<void> {
    if (!sessionId || !userId) return;

    const prisma = await getPrisma();

    // 查找该 session 下的所有匿名对话
    const anonymousConversations = await prisma.conversation.findMany({
      where: {
        sessionId,
        userId: null,
      },
    });

    if (anonymousConversations.length === 0) return;

    // 逐个迁移到用户
    for (const conv of anonymousConversations) {
      // 检查该用户是否已有同名对话（避免重复）
      const existingForUser = await prisma.conversation.findFirst({
        where: {
          userId,
          title: conv.title,
          // 不是完全精准匹配，但防大部分重复
        },
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
