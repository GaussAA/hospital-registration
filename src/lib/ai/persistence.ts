import { getPrisma } from "@/lib/db";

export interface PersistAssistantMessage {
  content: string;
  reasoningContent?: string;
}

export interface PersistToolCall {
  toolName: string;
  arguments: string;
  result: string;
  status: string;
}

/**
 * Centralized persistence layer for conversation data.
 */
export class ConversationPersistence {
  /**
   * 保存 AI 回复及其工具调用链。
   * 用户消息由 route 层立即持久化，此处仅保存 assistant 回复。
   *
   * @param conversationId - 对话 ID
   * @param assistantMessage - AI 回复内容（含可选的 reasoningContent）
   * @param toolCalls - 工具调用记录列表
   * @returns 创建的 assistant 消息 ID
   */
  static async saveAssistantResponse(
    conversationId: string,
    assistantMessage: PersistAssistantMessage,
    toolCalls: PersistToolCall[]
  ): Promise<string> {
    const prisma = await getPrisma();

    const msg = await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: assistantMessage.content || null,
        reasoningContent: assistantMessage.reasoningContent || null,
        toolCalls: {
          create: toolCalls.map((tc, idx) => ({
            sequence: idx,
            toolName: tc.toolName,
            arguments: tc.arguments,
            result: tc.result,
            status: tc.status,
          })),
        },
      },
    });

    return msg.id;
  }
}
