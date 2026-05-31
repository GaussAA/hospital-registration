import type { ChatMessage, ToolContext, ConversationState } from "./types";
import tools, { toolsToFunctionCalling } from "./tools";
import { completion, isProviderConfigured } from "./provider";

/**
 * AI Agent for hospital registration assistant.
 *
 * Architecture:
 * 1. Receives user message + conversation history
 * 2. Constructs a system prompt with context
 * 3. Calls LLM with function-calling tools
 * 4. If LLM calls a tool, executes it and feeds result back to LLM
 * 5. Returns final response
 */

/* ── System Prompt ── */

const SYSTEM_PROMPT = `你是"健康挂号"AI挂号助手，一个专业的医院挂号智能客服。你的使命是帮助用户通过对话完成挂号全流程。

## 核心能力
你可以通过调用工具来完成以下操作：
1. **搜索医院** — 按城市、等级、名称查找医院
2. **查看科室** — 查看某家医院有哪些科室
3. **查看医生** — 查看某个科室有哪些医生
4. **查看排班** — 查看医生未来7天的出诊排班和剩余号源
5. **管理就诊人** — 查看已有就诊人、添加新就诊人
6. **挂号** — 选择号源进行挂号
7. **查看挂号记录** — 查看历史或进行中的挂号
8. **取消挂号** — 取消待就诊的挂号

## 交互规范
- 始终使用**友好、温暖**的语气，称呼用户为"您"
- 回复要简洁清晰，分步骤引导用户
- 当用户表达模糊时，主动提供选项或引导选择
- 每次只问1-2个问题，不要一次性问太多
- 关键信息用加粗或分点呈现

## 挂号工作流
当用户需要挂号时，按以下流程逐步引导：
1. 先找医院 → 展示结果让用户选择
2. 选科室 → 展示结果让用户选择
3. 选医生 → 展示结果让用户选择
4. 看排班 → 展示号源，让用户选时段
5. 选就诊人 → 展示已有或新建
6. 确认信息 → 展示确认摘要
7. 完成挂号 → 调用 create_registration

## 重要原则
- 用户未登录时，工具会提示需要登录，此时引导用户去登录页面
- 如果用户不知道自己要挂什么科，根据常见症状推荐科室（如发烧→呼吸内科/发热门诊）`;
// Note: system prompt controls model behavior; see provider.ts for API configuration

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
  _state?: ConversationState
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
  } catch (error: any) {
    console.error("[AI Agent Error]", error);

    // Fallback to a simpler response
    if (error.message?.includes("401") || error.message?.includes("API key")) {
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

  // Build messages array for the LLM
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-20), // Keep last 20 messages for context
    { role: "user", content: message },
  ];

  let maxRounds = 8;

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
  if (user?.name) {
    return `${SYSTEM_PROMPT}\n\n当前用户：${user.name}`;
  }
  return SYSTEM_PROMPT;
}

export { SYSTEM_PROMPT };
