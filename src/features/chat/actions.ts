"use server";

import { ConversationStore } from "./agent/conversation-store";
import { ConversationPersistence } from "./agent/persistence";
import { createStreamResponse } from "./agent/stream-agent";
import type { ChatMessage, ToolContext } from "./types";

/**
 * Send a message and get a streaming response.
 * Returns a ReadableStream for the route layer.
 */
export async function streamChat(
  messages: ChatMessage[],
  context: ToolContext,
): Promise<{ stream: ReadableStream<Uint8Array>; promise: Promise<unknown> }> {
  return createStreamResponse(messages, context);
}

/**
 * Create a new conversation.
 */
export async function createConversation(sessionId: string, userId?: string): Promise<string> {
  return ConversationStore.create(sessionId, userId);
}

/**
 * Delete a conversation.
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await ConversationStore.remove(conversationId);
}

/**
 * Persist an assistant response (message + tool calls).
 */
export async function persistAssistantResponse(
  conversationId: string,
  content: string,
  toolCalls: Array<{ toolName: string; arguments: string; result: string; status: string }>,
  reasoningContent?: string,
): Promise<string> {
  return ConversationPersistence.saveAssistantResponse(conversationId, { content, reasoningContent }, toolCalls);
}
