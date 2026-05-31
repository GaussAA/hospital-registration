import type { ChatMessage } from "./types";

/**
 * 上下文压缩器。
 *
 * 解决长对话中的 Token 超限问题：
 * - 当消息数量超过阈值时，将早期消息压缩为摘要
 * - 保留核心上下文（最近 N 条消息完整保留）
 * - 保持系统提示完整
 */

const MAX_MESSAGES_BEFORE_COMPRESSION = 30;
const KEEP_RECENT_MESSAGES = 10;
const MAX_COMPRESSED_CONTEXT_LENGTH = 2000;

/**
 * 估计字符串的 token 数（粗略估算：中文字符≈2 tokens，其他≈0.3 tokens/字符）
 */
export function estimateTokens(text: string): number {
  let tokens = 0;
  for (const char of text) {
    if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(char)) {
      tokens += 2;
    } else {
      tokens += 0.3;
    }
  }
  return Math.ceil(tokens);
}

/**
 * 压缩消息列表。
 * - 保留系统提示
 * - 将中间消息压缩为摘要
 * - 保留最近的完整消息
 */
export function compressMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_BEFORE_COMPRESSION) {
    return messages;
  }

  const systemMessages = messages.filter((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  // 保留最近的完整消息
  const recentMessages = nonSystemMessages.slice(-KEEP_RECENT_MESSAGES);

  // 压缩中间消息
  const compressibleMessages = nonSystemMessages.slice(
    0,
    nonSystemMessages.length - KEEP_RECENT_MESSAGES
  );

  // 生成摘要
  const compressed = compressToSummary(compressibleMessages);

  return [...systemMessages, ...compressed, ...recentMessages].slice(0, 60);
}

/**
 * 将一系列消息压缩为简短的摘要。
 * 提取关键信息：用户选择、系统回复、工具调用结果。
 */
function compressToSummary(messages: ChatMessage[]): ChatMessage[] {
  const summaryParts: string[] = [];
  let userQueryCount = 0;

  for (const msg of messages) {
    if (msg.role === "user" && msg.content) {
      userQueryCount++;
      const truncated = msg.content.length > 100
        ? msg.content.slice(0, 100) + "…"
        : msg.content;
      summaryParts.push(`问: ${truncated}`);
    } else if (msg.role === "assistant" && msg.content) {
      const truncated = msg.content.length > 200
        ? msg.content.slice(0, 200) + "…"
        : msg.content;
      summaryParts.push(`答: ${truncated}`);
    } else if (msg.role === "tool" && msg.content) {
      // 工具结果只保留关键信息（挂号成功、搜索到等）
      const toolResult = msg.content.length > 150
        ? msg.content.slice(0, 150) + "…"
        : msg.content;
      summaryParts.push(`系统: ${toolResult}`);
    }
  }

  const summary = summaryParts.join("\n");

  // 如果摘要太长，截断
  const truncatedSummary = summary.length > MAX_COMPRESSED_CONTEXT_LENGTH
    ? summary.slice(0, MAX_COMPRESSED_CONTEXT_LENGTH) + "\n…[中间上下文已压缩]"
    : summary;

  return [
    {
      role: "system",
      content: `[以下为 ${userQueryCount} 轮历史对话的摘要]\n${truncatedSummary}\n[摘要结束]`,
    },
  ];
}

/**
 * 检查消息列表总 token 数是否超过限制。
 * 如果超过，自动压缩。
 */
export function autoCompress(messages: ChatMessage[], maxTokens: number = 12000): ChatMessage[] {
  const totalTokens = messages.reduce(
    (sum, m) => sum + estimateTokens(m.content || ""),
    0
  );

  if (totalTokens <= maxTokens) {
    return messages;
  }

  // 需要压缩——分步压缩直到低于阈值
  let compressed = [...messages];
  let rounds = 0;

  while (rounds < 3) {
    const currentTokens = compressed.reduce(
      (sum, m) => sum + estimateTokens(m.content || ""),
      0
    );
    if (currentTokens <= maxTokens) break;
    compressed = compressMessages(compressed);
    rounds++;
  }

  return compressed;
}
