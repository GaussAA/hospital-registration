/**
 * Agent Runner — pure function-style agent loop.
 *
 * Responsibilities:
 * - LLM API communication (callDeepSeek)
 * - SSE response parsing from API
 * - Tool execution
 * - Producing AgentEvent[] (abstract events, no serialization)
 *
 * NOT responsible for:
 * - SSE encoding/decoding for frontend
 * - Any persistence operations
 * - Session state management
 * - Frontend state management
 */

import type { ChatMessage, ToolContext, FunctionCallTool, ToolExecutionResult } from "./types";
import toolDefs from "./tools";

/* ── Config ── */

const BASE_URL = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "deepseek-v4-flash";
const REASONING_EFFORT = process.env.AI_REASONING_EFFORT || "off";

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

/* ── Agent Event Types ── */

/** Agent 事件（纯数据，不涉及序列化） */
export type AgentEvent =
  | { type: "text"; content: string }
  | { type: "reasoning"; content: string }
  | { type: "tool-call"; toolName: string; args: Record<string, unknown> }
  | { type: "tool-result"; toolName: string; result: string }
  | { type: "done" }
  | { type: "error"; message: string };

/** Agent 最终产物（供持久化层使用） */
export interface AgentResult {
  content: string;
  reasoningContent?: string;
  toolCalls: ToolExecutionResult[];
}

/**
 * 纯函数式 Agent 循环。
 *
 * 1. 调用 DeepSeek API（流式）
 * 2. 解析 API 返回的 SSE → 产出 AgentEvent[]
 * 3. 执行工具调用 → 收集 ToolExecutionResult
 * 4. 返回完整事件列表 + 最终结果 + 修改后的消息数组
 *
 * @param messages 初始消息列表（含 system prompt）
 * @param tools 工具定义（FunctionCallTool 格式）
 * @param context 工具执行上下文（userId, userRole）
 * @param onEvent 可选回调，每产生一个事件时触发（用于实时流式传输）
 */
export async function runAgentLoop(
  messages: ChatMessage[],
  tools: FunctionCallTool[],
  context: ToolContext,
  onEvent?: (event: AgentEvent) => void,
): Promise<{
  events: AgentEvent[];
  result: AgentResult;
  messages: ChatMessage[];
}> {
  const events: AgentEvent[] = [];
  const toolMap = new Map(toolDefs.map((t) => [t.name, t]));
  const overallStartTime = Date.now();
  const MAX_TOTAL_MS = 60000;
  const initialMsgCount = messages.length;

  // Track final round data
  let finalAssistantContent = "";
  let finalAssistantReasoningContent = "";

  const emit = (event: AgentEvent) => {
    events.push(event);
    onEvent?.(event);
  };

  for (let round = 0; round < 8; round++) {
    // 总超时检查
    if (Date.now() - overallStartTime > MAX_TOTAL_MS) {
      emit({ type: "text", content: "\n\n[请求超时，请重试]" });
      break;
    }

    // Call DeepSeek API
    const response = await callDeepSeek(messages, tools);

    let assistantContent = "";
    let assistantReasoningContent = "";
    let toolCalls: ToolCall[] = [];

    // Parse SSE response from API
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    const currentToolCalls = new Map<number, ToolCallDelta>();
    let lastChunkTime = Date.now();
    const IDLE_TIMEOUT_MS = 30000;

    while (true) {
      if (Date.now() - lastChunkTime > IDLE_TIMEOUT_MS) {
        console.warn("[agent-runner] Idle timeout reached, breaking");
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      lastChunkTime = Date.now();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();

        if (data === "[DONE]") continue;
        if (!data) continue;

        try {
          const chunk = JSON.parse(data);
          const delta = chunk.choices?.[0]?.delta;
          const finishReason = chunk.choices?.[0]?.finish_reason;

          // Handle reasoning/thinking content (DeepSeek reasoning mode)
          if (delta?.reasoning_content) {
            const reasoningText = delta.reasoning_content;
            assistantReasoningContent += reasoningText;
            emit({ type: "reasoning", content: reasoningText });
            continue;
          }

          if (delta?.content) {
            assistantContent += delta.content;
            emit({ type: "text", content: delta.content });
          }

          if (delta?.tool_calls) {
            for (const tc of (delta.tool_calls as Array<{ index: number; id?: string; type?: string; function?: { name?: string; arguments?: string } }>)) {
              const existing = currentToolCalls.get(tc.index) || { index: tc.index } as ToolCallDelta;
              if (tc.id) existing.id = tc.id;
              if (tc.type) existing.type = tc.type as "function";
              if (tc.function) {
                if (!existing.function) existing.function = { name: "", arguments: "" };
                if (tc.function.name) existing.function.name += tc.function.name;
                if (tc.function.arguments) existing.function.arguments += tc.function.arguments;
              }
              currentToolCalls.set(tc.index, existing);
            }
          }

          if (finishReason === "tool_calls" || finishReason === "stop") {
            break;
          }
        } catch {
          // Silently skip parse errors
        }
      }
    }

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

    if (toolCalls.length === 0) {
      // No tool calls — agent is done
      finalAssistantContent = assistantContent;
      finalAssistantReasoningContent = assistantReasoningContent;
      break;
    }

    // Add assistant message with tool calls to messages array
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: assistantContent || null,
      reasoningContent: assistantReasoningContent || undefined,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    };
    messages.push(assistantMsg);

    // Execute each tool and add results
    for (const tc of toolCalls) {
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        args = {};
      }

      // Emit tool-call event
      emit({ type: "tool-call", toolName: tc.function.name, args });

      const toolDef = toolMap.get(tc.function.name);
      let result: string;

      if (toolDef) {
        try {
          result = await toolDef.handler(args, context);
        } catch (e: unknown) {
          result = `工具执行错误: ${(e as { message?: string }).message}`;
        }
      } else {
        result = `未知工具: ${tc.function.name}`;
      }

      // Emit tool-result event
      emit({ type: "tool-result", toolName: tc.function.name, result });

      messages.push({
        role: "tool" as const,
        content: result,
        tool_call_id: tc.id,
      });
    }
  }

  // Emit done event
  emit({ type: "done" });

  // ── Build AgentResult for persistence ──

  // Find the last assistant message with tool_calls for persistence
  const newMessages = messages.slice(initialMsgCount);

  let lastToolRoundStartIdx = -1;
  for (let i = newMessages.length - 1; i >= 0; i--) {
    const m = newMessages[i];
    if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
      lastToolRoundStartIdx = i;
      break;
    }
  }

  // Extract only the last complete round's tool calls
  const lastRoundMessages = lastToolRoundStartIdx >= 0
    ? newMessages.slice(lastToolRoundStartIdx)
    : [];

  // Build ToolExecutionResult from the last round
  const lastAssistantMsg = lastRoundMessages.find(
    (m) => m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0
  );

  const toolCallsResult: ToolExecutionResult[] = [];
  if (lastAssistantMsg?.tool_calls) {
    for (const tc of lastAssistantMsg.tool_calls) {
      // Find matching tool result message
      const toolResultMsg = lastRoundMessages.find(
        (m) => m.role === "tool" && m.tool_call_id === tc.id
      );
      toolCallsResult.push({
        name: tc.function.name,
        arguments: tc.function.arguments,
        result: toolResultMsg?.content ?? "",
        status: toolResultMsg?.content?.startsWith("工具执行错误") || toolResultMsg?.content?.startsWith("未知工具") ? "error" : "success",
      });
    }
  }

  const result: AgentResult = {
    content: finalAssistantContent,
    reasoningContent: finalAssistantReasoningContent || undefined,
    toolCalls: toolCallsResult,
  };

  return { events, result, messages };
}

/**
 * Call DeepSeek Chat Completions API with streaming.
 */
async function callDeepSeek(
  messages: ChatMessage[],
  tools: FunctionCallTool[]
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages: messages.map((m) => {
      const msg: { role: string; content: string; tool_call_id?: string; tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> } = { role: m.role, content: m.content || "" };
      if ((m as unknown as { tool_call_id?: string }).tool_call_id) {
        msg.tool_call_id = (m as unknown as { tool_call_id: string }).tool_call_id;
      }
      if ((m as unknown as { tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> }).tool_calls) {
        msg.tool_calls = (m as unknown as { tool_calls: Array<{ id: string; type: string; function: { name: string; arguments: string } }> }).tool_calls;
      }
      return msg;
    }),
    stream: true,
    temperature: 0.7,
  };

  // Enable DeepSeek reasoning/thinking mode for complex tool calling
  if (REASONING_EFFORT !== "off") {
    body.reasoning = { effort: REASONING_EFFORT };
  }

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
