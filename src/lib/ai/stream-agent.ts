import toolDefs, { toolsToFunctionCalling } from "./tools";
import { SYSTEM_PROMPT } from "./agent";
import type { ToolContext, ChatMessage } from "./types";

/**
 * Stream Agent — direct DeepSeek Chat Completions API integration.
 * Uses native fetch + SSE parsing instead of Vercel AI SDK
 * to avoid Responses API compatibility issues with DeepSeek.
 */

/* ── Config ── */

const BASE_URL = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "deepseek-v4-flash";

/* ── Internal types for tool calling ── */

interface ToolCallDelta {
  index: number;
  id?: string;
  type?: "function";
  function?: { name?: string; arguments?: string };
}

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/**
 * Create a streaming SSE response from DeepSeek Chat Completions API.
 * Returns a ReadableStream that produces SSE events.
 */
export async function createStreamResponse(
  messages: Array<{ role: string; content: string }>,
  context: ToolContext
): Promise<ReadableStream> {
  const encoder = new TextEncoder();

  // Fallback: no API key
  if (!API_KEY) {
    const fallback = "您好！我是AI挂号助手。\n\n很抱歉，AI服务尚未配置API密钥，暂时无法使用智能对话功能。\n\n您可以通过页面上的菜单手动完成挂号。如需开启AI助手，请管理员在 `.env` 文件中配置 `AI_API_KEY`。";
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(fallback)}\n`));
        controller.enqueue(encoder.encode("e:finish\nd:{}\n\n"));
        controller.close();
      },
    });
  }

  const toolSchemas = toolsToFunctionCalling();

  // Build messages array for the LLM
  const allMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content || "",
    })),
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        await runAgentLoop(allMessages, toolSchemas, context, controller, encoder);
      } catch (err: any) {
        console.error("[stream-agent] Error:", err);
        controller.enqueue(encoder.encode(`e:error\nd:${JSON.stringify({ message: err.message || "未知错误" })}\n\n`));
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });
}

/**
 * Agent loop: LLM → tool call → result → LLM → finish.
 * Max 8 rounds.
 */
async function runAgentLoop(
  messages: ChatMessage[],
  tools: any[],
  context: ToolContext,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const toolMap = new Map(toolDefs.map((t) => [t.name, t]));
  let fullAssistantContent = "";

  for (let round = 0; round < 8; round++) {
    // Call DeepSeek API
    const response = await callDeepSeek(messages, tools);

    let assistantContent = "";
    let toolCalls: ToolCall[] = [];

    // Parse SSE response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let currentToolCalls = new Map<number, ToolCallDelta>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();

        // [DONE] signal
        if (data === "[DONE]") continue;
        if (!data) continue;

        try {
          const chunk = JSON.parse(data);
          const delta = chunk.choices?.[0]?.delta;
          const finishReason = chunk.choices?.[0]?.finish_reason;

          if (delta?.content) {
            assistantContent += delta.content;
            // Emit text chunk for typing effect
            controller.enqueue(encoder.encode(`0:${JSON.stringify(delta.content)}\n`));
          }

          // Handle tool calls from delta
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls as any[]) {
              const existing = currentToolCalls.get(tc.index) || { index: tc.index } as ToolCallDelta;
              if (tc.id) existing.id = tc.id;
              if (tc.type) existing.type = tc.type;
              if (tc.function) {
                if (!existing.function) existing.function = { name: "", arguments: "" };
                if (tc.function.name) existing.function.name += tc.function.name;
                if (tc.function.arguments) existing.function.arguments += tc.function.arguments;
              }
              currentToolCalls.set(tc.index, existing);
            }
          }

          // Finish reason indicates tool calls or done
          if (finishReason === "tool_calls" || finishReason === "stop") {
            break;
          }
        } catch {}
      }
    }

    // Build tool calls from accumulated deltas
    toolCalls = Array.from(currentToolCalls.values())
      .filter((tc) => tc.id && tc.function?.name)
      .map((tc) => ({
        id: tc.id!,
        type: "function" as const,
        function: {
          name: tc.function!.name!,
          arguments: tc.function!.arguments || "{}",
        },
      }));

    fullAssistantContent += assistantContent;

    // If no tool calls, we're done
    if (toolCalls.length === 0) break;

    // Add assistant message with tool calls to conversation
    const assistantMsg: any = { role: "assistant", content: assistantContent || null };
    assistantMsg.tool_calls = toolCalls.map((tc) => ({
      id: tc.id,
      type: tc.type,
      function: { name: tc.function.name, arguments: tc.function.arguments },
    }));
    messages.push(assistantMsg);

    // Execute each tool and add results
    for (const tc of toolCalls) {
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        args = {};
      }

      const toolDef = toolMap.get(tc.function.name);
      let result: string;

      if (toolDef) {
        try {
          result = await toolDef.handler(args, context);
        } catch (e: any) {
          result = `工具执行错误: ${e.message}`;
        }
      } else {
        result = `未知工具: ${tc.function.name}`;
      }

      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tc.id,
      } as any);
    }
  }

  // Emit finish event
  controller.enqueue(encoder.encode("e:finish\nd:{}\n\n"));
}

/**
 * Call DeepSeek Chat Completions API with streaming.
 */
async function callDeepSeek(
  messages: ChatMessage[],
  tools: any[]
): Promise<Response> {
  const body: Record<string, any> = {
    model: MODEL,
    messages: messages.map((m) => {
      const msg: any = { role: m.role, content: m.content || "" };
      // Pass through tool_call_id for tool results
      if ((m as any).tool_call_id) {
        msg.tool_call_id = (m as any).tool_call_id;
      }
      // Pass through tool_calls for assistant messages
      if ((m as any).tool_calls) {
        msg.tool_calls = (m as any).tool_calls;
      }
      return msg;
    }),
    stream: true,
    temperature: 0.7,
  };

  if (tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`DeepSeek API ${response.status}: ${errorText}`);
  }

  return response;
}

export default createStreamResponse;
