import { ConversationStore } from "./agent/conversation-store";
import type { ConversationSummary, ConversationDetail, ChatMessage } from "./types";

/**
 * List conversations for a session.
 */
export async function listConversations(
  sessionId: string,
  userId?: string,
): Promise<ConversationSummary[]> {
  return ConversationStore.list(sessionId, userId);
}

/**
 * Get conversation detail including all messages.
 */
export async function getConversation(
  conversationId: string,
): Promise<ConversationDetail | null> {
  return ConversationStore.getDetail(conversationId);
}

/**
 * Load conversation history as ChatMessage[] for the agent.
 */
export async function loadConversationHistory(
  conversationId: string,
  maxMessages: number = 40,
): Promise<ChatMessage[]> {
  return ConversationStore.loadHistoryAsChatMessages(conversationId, maxMessages);
}

/**
 * Get or create a conversation for a session.
 */
export async function getOrCreateConversation(
  sessionId: string,
  userId?: string,
): Promise<string> {
  return ConversationStore.getOrCreate(sessionId, userId);
}
