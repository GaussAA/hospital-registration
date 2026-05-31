import { getPrisma } from "@/lib/db";
import type { ConversationSummary, ConversationDetail } from "./types";

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
   * Batch add messages to a conversation (called at end of stream).
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
   * Get conversation detail including messages.
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
   * Delete a conversation and all its messages (cascade).
   */
  static async remove(conversationId: string): Promise<void> {
    const prisma = await getPrisma();
    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Merge anonymous conversations into a user account (for post-login merge).
   * Not implemented — P1 feature.
   */
  static async mergeToUser(_sessionId: string, _userId: string): Promise<void> {
    throw new Error("Not implemented: mergeToUser is a P1 feature");
  }
}
