import toolDefs, { toolsToFunctionCalling } from "./tools";
import { getSystemPrompt } from "./prompts/system";
import { UserMemoryStore, SessionMemoryStore, type SessionMemory } from "./memory-store";
import { autoCompress } from "./context-compressor";
import type { ToolContext, ChatMessage, FunctionCallTool } from "./types";

/**
 * Stream Agent — direct DeepSeek Chat Completions API integration.
 * Uses native fetch + SSE parsing instead of Vercel AI SDK
 * to avoid Responses API compatibility issues with DeepSeek.
 *
 * Features:
 * - SSE streaming with text chunks
 * - Tool call/result events for frontend visualization
 * - Long-term user memory
 * - Context compression for long conversations
 * - Session-level state tracking
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
  const sessionId = context.userId || "anonymous";

  // ── 加载用户记忆并注入系统提示 ──
  let memoryPrompt = "";
  let userName: string | undefined;

  if (context.userId) {
    // 从数据库中获取用户名称（如果有）
    try {
      const { getPrisma } = await import("@/lib/db");
      const prisma = await getPrisma();
      const user = await (prisma as unknown as { user: { findUnique: (args: { where: { id: string }, select: { name: boolean } }) => Promise<{ name: string } | null> } }).user.findUnique({
        where: { id: context.userId },
        select: { name: true },
      });
      if (user) userName = user.name;
    } catch {
      // non-critical
    }

    // 加载记忆
    memoryPrompt = await UserMemoryStore.buildMemoryPrompt(context.userId);

    // 记录本次活跃
    const existingMemory = await UserMemoryStore.get(context.userId);
    if (existingMemory) {
      existingMemory.lastActive = new Date();
      await UserMemoryStore.save(context.userId, existingMemory);
    }
  }

  // ── 构建系统提示 ──
  const systemContent = getSystemPrompt({
    name: userName,
    isAuthenticated: !!context.userId,
    ...(memoryPrompt ? { memory: memoryPrompt } : {}),
  });

  // ── 构建消息列表并使用上下文压缩 ──
  const allMessages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content || "",
    })),
  ];

  // 自动压缩超长上下文
  const compressedMessages = autoCompress(allMessages);

  // ── 会话级记忆：跟踪步骤状态 ──
  const sessionMem = SessionMemoryStore.get(sessionId) || {
    contextSummary: "",
    step: "idle",
    cache: {},
    estimatedTokens: 0,
  };

  return new ReadableStream({
    async start(controller) {
      try {
        await runAgentLoop(compressedMessages, toolSchemas, context, controller, encoder, sessionId, sessionMem);
      } catch (err: unknown) {
        console.error("[stream-agent] Error:", err);
        controller.enqueue(encoder.encode(`e:error\nd:${JSON.stringify({ message: (err as { message?: string }).message || "未知错误" })}\n\n`));
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });
}

/**
 * Agent loop: LLM → tool call → result → LLM → finish.
 * Max 8 rounds, with heartbeat and timeout protection.
 */
async function runAgentLoop(
  messages: ChatMessage[],
  tools: FunctionCallTool[],
  context: ToolContext,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  sessionId: string,
  sessionMem: SessionMemory
) {
  const toolMap = new Map(toolDefs.map((t) => [t.name, t]));
  const overallStartTime = Date.now();
  const MAX_TOTAL_MS = 60000; // 60s total timeout

  for (let round = 0; round < 8; round++) {
    // 总超时检查
    if (Date.now() - overallStartTime > MAX_TOTAL_MS) {
      controller.enqueue(encoder.encode(`0:${JSON.stringify("\n\n[请求超时，请重试]")}\n`));
      break;
    }

    // Call DeepSeek API
    const response = await callDeepSeek(messages, tools);

    let assistantContent = "";
    let toolCalls: ToolCall[] = [];

    // Parse SSE response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    const currentToolCalls = new Map<number, ToolCallDelta>();
    let lastChunkTime = Date.now();
    const IDLE_TIMEOUT_MS = 30000; // 30s idle timeout

    while (true) {
      // 空闲超时检查
      if (Date.now() - lastChunkTime > IDLE_TIMEOUT_MS) {
        console.warn("[stream-agent] Idle timeout reached, breaking");
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

          if (delta?.content) {
            assistantContent += delta.content;
            controller.enqueue(encoder.encode(`0:${JSON.stringify(delta.content)}\n`));
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
        } catch {}
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
      // 无工具调用——更新会话记忆标记
      sessionMem.step = "idle";
      SessionMemoryStore.set(sessionId, sessionMem);
      break;
    }

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: assistantContent || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    };
    messages.push(assistantMsg);

    // Execute each tool and add results
    for (const tc of toolCalls) {
      // Emit tool-call start event
      controller.enqueue(
        encoder.encode(`e:tool-call\nd:${JSON.stringify({ toolName: tc.function.name, args: tc.function.arguments })}\n\n`)
      );

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

          // ── 记忆：跟踪挂号流程步骤 ──
          if (tc.function.name === "search_hospitals") {
            sessionMem.step = "selecting_hospital";
          } else if (tc.function.name === "search_departments") {
            sessionMem.step = "selecting_department";
          } else if (tc.function.name === "search_doctors") {
            sessionMem.step = "selecting_doctor";
          } else if (tc.function.name === "get_doctor_schedules") {
            sessionMem.step = "checking_schedule";
          } else if (tc.function.name === "get_patient_profiles") {
            sessionMem.step = "selecting_profile";
          } else if (tc.function.name === "create_registration") {
            sessionMem.step = "done";

            // 记录用户偏好到长期记忆
            if (context.userId) {
              try {
                const cache = sessionMem.cache || {};
                if (cache.hospitalName) {
                  await UserMemoryStore.updatePreferences(context.userId, {
                    preferredHospitals: [cache.hospitalName as string],
                  });
                }
                if (cache.departmentName) {
                  await UserMemoryStore.updatePreferences(context.userId, {
                    preferredDepartments: [cache.departmentName as string],
                  });
                }
              } catch {
                // non-critical
              }
            }
          } else if (tc.function.name === "cancel_registration") {
            sessionMem.step = "idle";
          }

          // 缓存关键选择数据
          if (!sessionMem.cache) sessionMem.cache = {};
          if (tc.function.name === "search_hospitals" && args.keyword) {
            sessionMem.cache.lastSearchKeyword = args.keyword;
          }
        } catch (e: unknown) {
          result = `工具执行错误: ${(e as { message?: string }).message}`;
        }
      } else {
        result = `未知工具: ${tc.function.name}`;
      }

      // Emit tool-result event
      controller.enqueue(
        encoder.encode(`e:tool-result\nd:${JSON.stringify({ toolName: tc.function.name, result })}\n\n`)
      );

      messages.push({
        role: "tool" as const,
        content: result,
        tool_call_id: tc.id,
      });
    }

    // 保存会话记忆
    SessionMemoryStore.set(sessionId, sessionMem);
  }

  // Emit complete tool call chain for persistence (single-line SSE event)
  const toolMessagesForPersistence = messages
    .filter((m) => {
      return (
        (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) ||
        m.role === "tool"
      );
    })
    .slice(-10)
    .map((m) => {
      if (m.role === "assistant") {
        return {
          role: "assistant",
          content: m.content,
          toolCalls: JSON.stringify(m.tool_calls || []),
        };
      }
      if (m.role === "tool") {
        return {
          role: "tool",
          content: m.content,
          toolCalls: JSON.stringify({
            tool_call_id: m.tool_call_id || "",
          }),
        };
      }
      return { role: m.role, content: m.content };
    });

  if (toolMessagesForPersistence.length > 0) {
    controller.enqueue(
      encoder.encode(
        `e:tool-messages:${JSON.stringify({ messages: toolMessagesForPersistence })}\n`
      )
    );
  }

  controller.enqueue(encoder.encode("e:finish\nd:{}\n\n"));
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
