import type { ChatMessage, ToolContext, ConversationState } from "../types";
import tools, { toolsToFunctionCalling } from "../tools/registry";
import { completion, isProviderConfigured } from "./provider";
import { getSystemPrompt, SYSTEM_PROMPT } from "../prompts/system";

/**
 * @deprecated 请使用 stream-agent.ts（流式 Agent）替代。
 * 此文件保留仅用于向后兼容 `/api/chat` 非流式路由。
 * 新功能开发请使用 `createStreamResponse()` from `./stream-agent`。
 *
 * AI Agent for hospital registration assistant.
 *
 * Architecture:
 * 1. Receives user message + conversation history
 * 2. Constructs a system prompt with context
 * 3. Calls LLM with function-calling tools
 * 4. If LLM calls a tool, executes it and feeds result back to LLM
 * 5. Returns final response
 */

/* ── Local fallback for when no API key configured ── */

function getNoApiKeyResponse(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("挂号") || msg.includes("预约") || msg.includes("医生") || msg.includes("医院") || msg.includes("科室")) {
    return "您好！我是AI挂号助手。\n\n很抱歉，AI服务尚未配置API密钥，暂时无法使用智能对话功能。\n\n您可以通过以下方式完成挂号：\n1. 在首页搜索医院\n2. 选择科室和医生\n3. 查看排班并手动挂号\n\n如需开启AI助手，请管理员在 `.env` 文件中配置 `AI_API_KEY`。";
  }
  return '您好！我是AI挂号助手，可以帮助您完成在线挂号。\n\n请告诉我想挂什么科、找哪位医生，或者直接说「我想挂号」，我来帮您一步步完成！';
}

/* ── Agent Logic ── */

export interface AgentResult {
  reply: string;
  state?: ConversationState;
}

/**
 * Process a user message and return the AI response.
 */
export async function processMessage(
  message: string,
  history: ChatMessage[],
  context: ToolContext,
): Promise<AgentResult> {
  // Clean the input
  const cleaned = message.trim();
  if (!cleaned) {
    return { reply: "请告诉我您需要什么帮助？" };
  }

  // Check if provider is configured
  if (!isProviderConfigured()) {
    return { reply: getNoApiKeyResponse(cleaned) };
  }

  try {
    const result = await runAgentLoop(cleaned, history, context);
    return { reply: result };
  } catch (error: unknown) {
    console.error("[AI Agent Error]", error);

    // Fallback to a simpler response
    const err = error as { message?: string };
    if (err.message?.includes("401") || err.message?.includes("API key")) {
      return {
        reply: "AI 服务 API 密钥无效或已过期，请管理员检查配置。您可以先使用手动流程完成挂号。",
      };
    }

    return {
      reply: "抱歉，我遇到了一些技术问题。请稍后再试，或通过页面上的菜单手动完成挂号。",
    };
  }
}

/**
 * The core agent loop: LLM → tool call → result → LLM → final response.
 * Max 8 rounds of tool calling to prevent infinite loops.
 */
async function runAgentLoop(
  message: string,
  history: ChatMessage[],
  context: ToolContext
): Promise<string> {
  const functionTools = toolsToFunctionCalling();
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  // Build system prompt with user context
  const systemPrompt = context.userId
    ? getSystemPrompt()
    : getSystemPrompt();

  // Build messages array for the LLM
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-20), // Keep last 20 messages for context
    { role: "user", content: message },
  ];

  const maxRounds = 8;

  for (let round = 0; round < maxRounds; round++) {
    const response = await completion({
      messages,
      tools: functionTools,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Extract the assistant's response
    const assistantContent = response.content || "";

    // If no tool calls, the LLM is done
    if (!response.toolCalls || response.toolCalls.length === 0) {
      return assistantContent || "好的，请问还有什么可以帮您的？";
    }

    // Handle the special case where no API key is configured (mock tool call)
    if (response.toolCalls[0].function.name === "no_api_key_configured") {
      return getNoApiKeyResponse(message);
    }

    // Add assistant message
    messages.push({
      role: "assistant",
      content: assistantContent || null,
    });

    // Process each tool call
    for (const tc of response.toolCalls) {
      const toolDef = toolMap.get(tc.function.name);
      if (!toolDef) {
        messages.push({
          role: "tool",
          content: JSON.stringify({ error: `未知工具: ${tc.function.name}` }),
          // Note: this is not a standard OpenAI format but works with DeepSeek
        });
        continue;
      }

      let args: Record<string, unknown>;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        messages.push({
          role: "tool",
          content: JSON.stringify({ error: "工具参数解析失败" }),
        });
        continue;
      }

      // Execute the tool
      const result = await toolDef.handler(args, context);
      messages.push({
        role: "tool",
        content: result,
      });
    }
  }

  // If we exhausted rounds, just take the last assistant content or generate a summary
  return "请问您还需要什么帮助？如果问题比较复杂，可以分段告诉我。";
}

/* ── Helper: Generate a system prompt with personalized context ── */

export function buildSystemPromptWithUserContext(user?: { name?: string }): string {
  return getSystemPrompt(user);
}

export { SYSTEM_PROMPT };
