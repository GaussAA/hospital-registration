/**
 * Stream Agent — Orchestration layer for AI streaming responses.
 *
 * Responsibilities:
 * - Build system prompt with user memory
 * - Compress conversation context
 * - Call runAgentLoop() from agent-runner.ts (pure agent loop)
 * - Serialize events to SSE via stream-handler.ts
 * - Manage session state (step tracking, cache)
 * - Perform user preference updates on completion
 *
 * Returns { stream: ReadableStream, result: AgentResult } for route layer.
 */

import type { ChatMessage, ToolContext } from "../types";
import type { AgentResult } from "./agent-runner";
import { runAgentLoop } from "./agent-runner";
import { createSSEStream } from "./stream-handler";
import { toolsToFunctionCalling } from "./tools";
import { getSystemPrompt } from "../prompts/system";
import { UserMemoryStore, SessionMemoryStore } from "./memory-store";
import { autoCompress } from "./context-compressor";

/* ── Config ── */

const API_KEY = process.env.AI_API_KEY || "";

/**
 * Create a streaming SSE response from the agent loop.
 *
 * @param messages Chat message history (including the new user message)
 * @param context Tool execution context
 * @returns { stream: SSE ReadableStream, result: AgentResult for persistence }
 */
export async function createStreamResponse(
  messages: ChatMessage[],
  context: ToolContext
): Promise<{ stream: ReadableStream<Uint8Array>; promise: Promise<AgentResult> }> {
  const encoder = new TextEncoder();

  // Fallback: no API key
  if (!API_KEY) {
    const fallback = "您好！我是AI挂号助手。\n\n很抱歉，AI服务尚未配置API密钥，暂时无法使用智能对话功能。\n\n您可以通过页面上的菜单手动完成挂号。如需开启AI助手，请管理员在 `.env` 文件中配置 `AI_API_KEY`。";
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(fallback)}\n`));
        controller.enqueue(encoder.encode("e:finish\n"));
        controller.close();
      },
    });
    const result: AgentResult = { content: fallback, reasoningContent: undefined, toolCalls: [] };
    return { stream, promise: Promise.resolve(result) };
  }

  const toolSchemas = toolsToFunctionCalling();
  const sessionId = context.userId || "anonymous";

  // ── 加载用户记忆并注入系统提示 ──
  let memoryPrompt = "";
  let userName: string | undefined;

  if (context.userId) {
    // 从数据库中获取用户名称（如果有）
    try {
      const { getPrisma } = await import("@/shared/db");
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
    ...messages.map((m) => {
      const chatMsg: ChatMessage = {
        role: m.role,
        content: m.content || "",
      };
      // Preserve tool call data for DeepSeek API
      if (m.tool_calls) {
        chatMsg.tool_calls = m.tool_calls;
      }
      if (m.tool_call_id) {
        chatMsg.tool_call_id = m.tool_call_id;
      }
      return chatMsg;
    }),
  ];

  // 自动压缩超长上下文
  const compressedMessages = autoCompress(allMessages);

  // ── 会话级记忆：加载步骤状态 ──
  const existingSessionMem = await SessionMemoryStore.get(sessionId);
  const sessionMem = existingSessionMem || {
    contextSummary: "",
    step: "idle",
    cache: {},
    estimatedTokens: 0,
  };

  // ── 运行 Agent 循环（实时流式，非阻塞）──
  // Create SSE stream first so we can push events in real-time
  const { stream, pushEvent } = createSSEStream();

  // Run agent loop in background (don't await — stream must be returned immediately)
  // The promise resolves when the loop completes, for post-processing
  const agentPromise = runAgentLoop(
    compressedMessages,
    toolSchemas,
    context,
    pushEvent, // onEvent callback — pushes each event to SSE stream in real-time
  ).then(async ({ result: agentResult }) => {
    // ── 更新会话记忆（基于工具执行结果） ──
    for (const tc of agentResult.toolCalls) {
    if (tc.name === "search_hospitals") {
      sessionMem.step = "selecting_hospital";
      try {
        const args = JSON.parse(tc.arguments);
        if (args.keyword) {
          if (!sessionMem.cache) sessionMem.cache = {};
          sessionMem.cache.lastSearchKeyword = args.keyword;
        }
      } catch { /* skip */ }
    } else if (tc.name === "search_departments") {
      sessionMem.step = "selecting_department";
    } else if (tc.name === "search_doctors") {
      sessionMem.step = "selecting_doctor";
    } else if (tc.name === "get_doctor_schedules") {
      sessionMem.step = "checking_schedule";
    } else if (tc.name === "get_patient_profiles") {
      sessionMem.step = "selecting_profile";
    } else if (tc.name === "create_registration") {
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
    } else if (tc.name === "cancel_registration") {
      sessionMem.step = "idle";
    }
  }

  // 保存会话记忆
  await SessionMemoryStore.set(sessionId, sessionMem);

  return agentResult;
});

  // ── 返回 SSE 流和 Agent 结果 Promise ──
  // Stream 已通过 pushEvent 实时推送，无需额外序列化
  // agentPromise 在 Agent 循环完成后 resolve，供持久化使用

  return { stream, promise: agentPromise };
}

export default createStreamResponse;
