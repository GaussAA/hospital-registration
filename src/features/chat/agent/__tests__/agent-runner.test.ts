import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChatMessage, ToolContext, FunctionCallTool } from "../../types";

// Set test env vars BEFORE any imports
vi.hoisted(() => {
  process.env.AI_BASE_URL = "https://test-api.example.com";
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "test-model";
  process.env.AI_REASONING_EFFORT = "off";
});

/* ── Helper: build SSE response data lines ── */

function sseData(data: string): string {
  return `data: ${data}\n`;
}

function sseContentChunk(
  content: string,
  finishReason: string | null = null
): string {
  const fr = finishReason ? `,"finish_reason":"${finishReason}"` : "";
  return sseData(
    JSON.stringify({
      choices: [
        { delta: { content }, index: 0, finish_reason: finishReason },
      ],
    })
  );
}

function sseToolCallChunk(
  toolCalls: Array<{
    index: number;
    id?: string;
    type?: string;
    function?: { name?: string; arguments?: string };
  }>,
  finishReason: string | null = null
): string {
  const fr = finishReason ? `,"finish_reason":"${finishReason}"` : "";
  return sseData(
    JSON.stringify({
      choices: [
        { delta: { content: null, tool_calls: toolCalls }, index: 0, finish_reason: finishReason },
      ],
    })
  );
}

function sseReasoningChunk(content: string): string {
  return sseData(
    JSON.stringify({
      choices: [
        { delta: { reasoning_content: content }, index: 0, finish_reason: null },
      ],
    })
  );
}

function sseDone(): string {
  return "data: [DONE]\n";
}

function createMockSSEResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

/* ── Mock tool definitions ── */

const mockSearchHospitalsHandler = vi.hoisted(() => vi.fn().mockResolvedValue(
  JSON.stringify([{ id: "hosp1", name: "测试医院" }])
));
const mockSearchDoctorsHandler = vi.hoisted(() => vi.fn().mockResolvedValue(
  JSON.stringify([{ id: "doc1", name: "测试医生" }])
));
const mockErrorToolHandler = vi.hoisted(() => vi.fn().mockRejectedValue(new Error("工具执行失败")));

// Mock ../tools default export BEFORE importing runAgentLoop
vi.mock("../tools", () => ({
  default: [
    {
      name: "search_hospitals",
      description: "搜索医院",
      parameters: {
        keyword: { type: "string", description: "关键词", required: true },
      },
      handler: mockSearchHospitalsHandler,
    },
    {
      name: "search_doctors",
      description: "搜索医生",
      parameters: {
        hospitalId: { type: "string", description: "医院ID", required: true },
        departmentId: { type: "string", description: "科室ID", required: true },
      },
      handler: mockSearchDoctorsHandler,
    },
    {
      name: "error_tool",
      description: "会抛错的工具",
      parameters: {},
      handler: mockErrorToolHandler,
    },
  ],
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import AFTER mocks
import { runAgentLoop, type AgentEvent, type AgentResult } from "../agent-runner";

describe("agent-runner", () => {
  const baseContext: ToolContext = { userId: "user1", userRole: "patient" };
  const toolSchemas: FunctionCallTool[] = [
    {
      type: "function",
      function: {
        name: "search_hospitals",
        description: "搜索医院",
        parameters: {
          type: "object",
          properties: { keyword: { type: "string", description: "关键词" } },
          required: ["keyword"],
        },
      },
    },
  ];

  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.AI_BASE_URL = "https://test-api.example.com";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    process.env.AI_REASONING_EFFORT = "off";

    mockFetch.mockReset();
    mockSearchHospitalsHandler.mockClear();
    mockSearchDoctorsHandler.mockClear();
    mockErrorToolHandler.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  /* ── Test: 无工具调用，直接完成 ── */
  it("should complete directly when no tool calls are made (finish_reason=stop)", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "You are a helper" },
      { role: "user", content: "Hello" },
    ];

    const sseChunks = [
      sseContentChunk("您好！", null),
      sseContentChunk(" 请问有什么可以帮您？", null),
      sseContentChunk("", "stop"),
      sseDone(),
    ];

    mockFetch.mockResolvedValue(createMockSSEResponse(sseChunks));

    const onEvent = vi.fn();
    const result = await runAgentLoop(messages, toolSchemas, baseContext, onEvent);

    // Check onEvent was called for each text chunk
    expect(onEvent).toHaveBeenCalledWith({ type: "text", content: "您好！" });
    expect(onEvent).toHaveBeenCalledWith({
      type: "text",
      content: " 请问有什么可以帮您？",
    });
    expect(onEvent).toHaveBeenCalledWith({ type: "done" });

    // Check final result
    expect(result.result.content).toBe("您好！ 请问有什么可以帮您？");
    expect(result.result.toolCalls).toEqual([]);
    expect(result.result.reasoningContent).toBeUndefined();

    // Check events array
    expect(result.events.filter((e) => e.type === "text")).toHaveLength(2);
    expect(result.events.filter((e) => e.type === "done")).toHaveLength(1);

    // Check fetch was called with correct URL and body
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe("https://test-api.example.com/chat/completions");
    expect(fetchCall[1].method).toBe("POST");
    expect(JSON.parse(fetchCall[1].body).stream).toBe(true);
    expect(JSON.parse(fetchCall[1].body).model).toBe("test-model");
  });

  /* ── Test: 无工具调用 (finish_reason 不存在但无 tool_calls delta) ── */
  it("should handle finish without explicit finish_reason", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "You are a helper" },
      { role: "user", content: "Hi" },
    ];

    // Only content chunks, no finish_reason in data, then stream ends
    const sseChunks = [
      sseContentChunk("Hello", null),
      sseContentChunk(" world", null),
      sseDone(),
    ];

    mockFetch.mockResolvedValue(createMockSSEResponse(sseChunks));

    const result = await runAgentLoop(messages, toolSchemas, baseContext);

    expect(result.result.content).toBe("Hello world");
    expect(result.result.toolCalls).toEqual([]);
    expect(result.events.some((e) => e.type === "done")).toBe(true);
  });

  /* ── Test: Reasoning content ── */
  it("should handle reasoning/thinking content from DeepSeek", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "Think step by step" },
      { role: "user", content: "Book a hospital appointment" },
    ];

    const sseChunks = [
      sseReasoningChunk("用户想要预约挂号，"),
      sseReasoningChunk("需要先搜索医院。"),
      sseContentChunk("好的，我来帮您搜索医院。", "stop"),
      sseDone(),
    ];

    mockFetch.mockResolvedValue(createMockSSEResponse(sseChunks));

    const onEvent = vi.fn();
    const result = await runAgentLoop(messages, toolSchemas, baseContext, onEvent);

    // Verify reasoning events
    expect(onEvent).toHaveBeenCalledWith({
      type: "reasoning",
      content: "用户想要预约挂号，",
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "reasoning",
      content: "需要先搜索医院。",
    });

    expect(result.result.reasoningContent).toBe(
      "用户想要预约挂号，需要先搜索医院。"
    );
    expect(result.result.content).toBe("好的，我来帮您搜索医院。");
  });

  /* ── Test: 触发总超时 (MAX_TOTAL_MS = 60000) ── */
  it("should emit timeout event when overall time exceeds MAX_TOTAL_MS", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    // Mock Date.now to simulate timeout — first call is start time,
    // after the first callDeepSeek, return a time > 60s later
    let callCount = 0;
    const dateNowSpy = vi.spyOn(Date, "now").mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        return 200000; // > 60000ms, triggers timeout
      }
      return 100000; // base start time
    });

    // Mock fetch to never resolve (or just return a valid response that gets ignored due to timeout)
    // Actually, the overall timeout check happens BEFORE callDeepSeek, so we just need
    // Date.now() to return values that make the time difference > 60000
    mockFetch.mockResolvedValue(createMockSSEResponse([sseContentChunk("ok", "stop")]));

    const onEvent = vi.fn();
    const result = await runAgentLoop(messages, toolSchemas, baseContext, onEvent);

    expect(onEvent).toHaveBeenCalledWith({
      type: "text",
      content: "\n\n[请求超时，请重试]",
    });
    expect(onEvent).toHaveBeenCalledWith({ type: "done" });
    expect(result.result.content).toBe("");

    dateNowSpy.mockRestore();
  });

  /* ── Test: 触发空闲超时 (IDLE_TIMEOUT_MS = 30000) ── */
  it("should break on idle timeout when no chunks received for 30s", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hi" },
    ];

    // We need to simulate a stream where a chunk arrives, then time jumps > 30s
    const encoder = new TextEncoder();
    let chunkIndex = 0;
    const chunkData = [
      encoder.encode(sseContentChunk("First chunk", null)),
      // This second enqueue will be delayed beyond idle timeout
    ];

    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        chunkIndex++;
        if (chunkIndex === 1) {
          return Promise.resolve({ done: false, value: encoder.encode(sseContentChunk("Hello", null)) });
        }
        if (chunkIndex === 2) {
          // Simulate idle timeout by returning a value but Date.now diff > 30000
          return Promise.resolve({ done: false, value: encoder.encode(sseContentChunk("", "stop")) });
        }
        return Promise.resolve({ done: true, value: undefined });
      }),
    };

    const mockResponse = {
      body: {
        getReader: () => mockReader,
      },
      ok: true,
    };

    mockFetch.mockResolvedValue(mockResponse as unknown as Response);

    // Spy on Date.now to return a very large value after the first chunk is read
    let dateCallCount = 0;
    const dateNowSpy = vi.spyOn(Date, "now").mockImplementation(() => {
      dateCallCount++;
      // After a few calls (start + initial check), return a future time
      if (dateCallCount > 3) {
        return 200000; // far in the future, exceeds idle timeout
      }
      return 100000;
    });

    // Spy on console.warn to verify timeout message
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await runAgentLoop(messages, toolSchemas, baseContext);

    expect(warnSpy).toHaveBeenCalledWith(
      "[agent-runner] Idle timeout reached, breaking"
    );
    expect(result.result.content).toBe("Hello");

    warnSpy.mockRestore();
    dateNowSpy.mockRestore();
  });

  /* ── Test: 工具调用 ── */
  it("should execute tool calls and continue the loop", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "搜索医院" },
    ];

    // Round 1: Tool call → search_hospitals
    // Round 2: Final response after tool result
    let round = 0;
    mockFetch.mockImplementation(async () => {
      round++;
      if (round === 1) {
        return createMockSSEResponse([
          sseContentChunk("正在搜索医院...", null),
          sseToolCallChunk(
            [
              {
                index: 0,
                id: "call_abc123",
                type: "function",
                function: { name: "search_hospitals", arguments: '{"keyword":"测试"}' },
              },
            ],
            "tool_calls"
          ),
          sseDone(),
        ]);
      } else {
        return createMockSSEResponse([
          sseContentChunk("找到了以下医院：", null),
          sseContentChunk("测试医院", null),
          sseContentChunk("", "stop"),
          sseDone(),
        ]);
      }
    });

    const onEvent = vi.fn();
    const result = await runAgentLoop(messages, toolSchemas, baseContext, onEvent);

    // Check tool events
    expect(onEvent).toHaveBeenCalledWith({
      type: "tool-call",
      toolName: "search_hospitals",
      args: { keyword: "测试" },
    });
    expect(onEvent).toHaveBeenCalledWith({
      type: "tool-result",
      toolName: "search_hospitals",
      result: JSON.stringify([{ id: "hosp1", name: "测试医院" }]),
    });

    // Check tool was called with correct args
    expect(mockSearchHospitalsHandler).toHaveBeenCalledWith(
      { keyword: "测试" },
      baseContext
    );

    // Check final result
    expect(result.result.content).toBe("找到了以下医院：测试医院");
    expect(result.result.toolCalls).toHaveLength(1);
    expect(result.result.toolCalls[0].name).toBe("search_hospitals");
    expect(result.result.toolCalls[0].status).toBe("success");

    // Check that messages include assistant + tool messages
    expect(result.messages.length).toBeGreaterThan(messages.length);
    const assistantMsgs = result.messages.filter((m) => m.role === "assistant");
    expect(assistantMsgs.length).toBeGreaterThanOrEqual(1);
  });

  /* ── Test: 多工具调用 ── */
  it("should handle multiple tool calls in a single round", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "搜索多个" },
    ];

    let round = 0;
    mockFetch.mockImplementation(async () => {
      round++;
      if (round === 1) {
        return createMockSSEResponse([
          sseToolCallChunk(
            [
              {
                index: 0,
                id: "call_1",
                type: "function",
                function: { name: "search_hospitals", arguments: '{"keyword":"一院"}' },
              },
              {
                index: 1,
                id: "call_2",
                type: "function",
                function: { name: "search_doctors", arguments: '{"hospitalId":"h1","departmentId":"d1"}' },
              },
            ],
            "tool_calls"
          ),
          sseDone(),
        ]);
      } else {
        return createMockSSEResponse([
          sseContentChunk("全部完成", "stop"),
          sseDone(),
        ]);
      }
    });

    const result = await runAgentLoop(messages, toolSchemas, baseContext);

    expect(mockSearchHospitalsHandler).toHaveBeenCalledTimes(1);
    expect(mockSearchDoctorsHandler).toHaveBeenCalledTimes(1);

    const toolCallEvents = result.events.filter((e) => e.type === "tool-call");
    expect(toolCallEvents).toHaveLength(2);
  });

  /* ── Test: 未识别工具 ── */
  it("should emit error result for unknown tools", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "调用未知工具" },
    ];

    mockFetch.mockResolvedValue(
      createMockSSEResponse([
        sseToolCallChunk(
          [
            {
              index: 0,
              id: "call_unknown",
              type: "function",
              function: { name: "nonexistent_tool", arguments: "{}" },
            },
          ],
          "tool_calls"
        ),
        sseDone(),
      ])
    );

    const onEvent = vi.fn();
    const result = await runAgentLoop(messages, toolSchemas, baseContext, onEvent);

    // Should emit tool-result with error message
    expect(onEvent).toHaveBeenCalledWith({
      type: "tool-result",
      toolName: "nonexistent_tool",
      result: "未知工具: nonexistent_tool",
    });

    // Result should have the tool call with error status
    expect(result.result.toolCalls[0].status).toBe("error");
  });

  /* ── Test: 工具执行抛出异常 ── */
  it("should handle tool handler throwing an error", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "执行会出错工具" },
    ];

    mockFetch.mockResolvedValue(
      createMockSSEResponse([
        sseToolCallChunk(
          [
            {
              index: 0,
              id: "call_err",
              type: "function",
              function: { name: "error_tool", arguments: "{}" },
            },
          ],
          "tool_calls"
        ),
        sseDone(),
      ])
    );

    const onEvent = vi.fn();
    const result = await runAgentLoop(messages, toolSchemas, baseContext, onEvent);

    expect(onEvent).toHaveBeenCalledWith({
      type: "tool-result",
      toolName: "error_tool",
      result: expect.stringContaining("工具执行错误"),
    });

    expect(result.result.toolCalls[0].status).toBe("error");
  });

  /* ── Test: 工具参数解析失败 ── */
  it("should handle invalid JSON in tool arguments", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "参数错误" },
    ];

    // Mock a tool call with invalid JSON arguments
    const encoder = new TextEncoder();
    // Stream with partial tool call arguments that form invalid JSON
    const stream = new ReadableStream({
      start(controller) {
        // First chunk: start of tool call with partial args
        controller.enqueue(
          encoder.encode(
            sseToolCallChunk(
              [
                {
                  index: 0,
                  id: "call_bad_args",
                  type: "function",
                  function: { name: "search_hospitals", arguments: "not-json" },
                },
              ],
              "tool_calls"
            )
          )
        );
        // Second chunk: finish
        controller.enqueue(encoder.encode(sseDone()));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      }) as Response
    );

    const result = await runAgentLoop(messages, toolSchemas, baseContext);

    // When args is invalid JSON, it falls back to {}
    expect(mockSearchHospitalsHandler).toHaveBeenCalledWith({}, baseContext);
  });

  /* ── Test: API 调用返回错误 ── */
  it("should throw when API returns non-OK status", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Invalid API key"),
    } as unknown as Response);

    await expect(
      runAgentLoop(messages, toolSchemas, baseContext)
    ).rejects.toThrow("DeepSeek API 401");
  });

  /* ── Test: SSE 解析错误（畸形 JSON）── */
  it("should skip malformed SSE data silently", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("data: invalid json\n"));
        controller.enqueue(encoder.encode(sseContentChunk("Valid", "stop")));
        controller.enqueue(encoder.encode(sseDone()));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue(
      new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      }) as unknown as Response
    );

    const result = await runAgentLoop(messages, toolSchemas, baseContext);

    // Should still get the valid chunk
    expect(result.result.content).toBe("Valid");
  });

  /* ── Test: 最大 8 轮循环限制 ── */
  it("should stop after 8 rounds of tool calls", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "loop" },
    ];

    // Always return tool_calls to keep the loop going
    mockFetch.mockResolvedValue(
      createMockSSEResponse([
        sseToolCallChunk(
          [
            {
              index: 0,
              id: "call_loop",
              type: "function",
              function: { name: "search_hospitals", arguments: '{"keyword":"loop"}' },
            },
          ],
          "tool_calls"
        ),
        sseDone(),
      ])
    );

    const result = await runAgentLoop(messages, toolSchemas, baseContext);

    // fetch should be called at most 8 times
    expect(mockFetch).toHaveBeenCalledTimes(8);
    expect(mockSearchHospitalsHandler).toHaveBeenCalledTimes(8);
    expect(result.events.some((e) => e.type === "done")).toBe(true);
  });

  /* ── Test: 没有 body reader ── */
  it("should throw when response has no body", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      body: null,
    } as unknown as Response);

    await expect(
      runAgentLoop(messages, toolSchemas, baseContext)
    ).rejects.toThrow("No response body");
  });

  /* ── Test: Base URL trailing slash trimming ── */
  it("should trim trailing slashes from BASE_URL", async () => {
    process.env.AI_BASE_URL = "https://api.test.com/v1///";

    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    mockFetch.mockResolvedValue(
      createMockSSEResponse([sseContentChunk("ok", "stop"), sseDone()])
    );

    await runAgentLoop(messages, toolSchemas, baseContext);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/chat/completions",
      expect.anything()
    );
  });

  /* ── Test: with reasoning effort ── */
  it("should include reasoning in request when REASONING_EFFORT is set", async () => {
    process.env.AI_REASONING_EFFORT = "high";

    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    mockFetch.mockResolvedValue(
      createMockSSEResponse([sseContentChunk("ok", "stop"), sseDone()])
    );

    await runAgentLoop(messages, toolSchemas, baseContext);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reasoning).toEqual({ effort: "high" });
  });

  /* ── Test: onEvent is optional ── */
  it("should work without onEvent callback", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    mockFetch.mockResolvedValue(
      createMockSSEResponse([sseContentChunk("hi", "stop"), sseDone()])
    );

    // Should not throw
    const result = await runAgentLoop(messages, toolSchemas, baseContext);
    expect(result.result.content).toBe("hi");
  });

  /* ── Test: AgentResult type shape ── */
  it("should return correctly shaped AgentResult", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "hello" },
    ];

    mockFetch.mockResolvedValue(
      createMockSSEResponse([sseContentChunk("Reply", "stop"), sseDone()])
    );

    const { result } = await runAgentLoop(messages, toolSchemas, baseContext);

    // Type check
    const agentResult: AgentResult = result;
    expect(typeof agentResult.content).toBe("string");
    expect(Array.isArray(agentResult.toolCalls)).toBe(true);
    // reasoningContent is optional
    if (agentResult.reasoningContent !== undefined) {
      expect(typeof agentResult.reasoningContent).toBe("string");
    }
  });

  /* ── Test: messages array is mutated correctly ── */
  it("should add assistant and tool messages to the messages array", async () => {
    const messages: ChatMessage[] = [
      { role: "system", content: "system" },
      { role: "user", content: "搜索医院" },
    ];
    const initialLen = messages.length;

    let round = 0;
    mockFetch.mockImplementation(async () => {
      round++;
      if (round === 1) {
        return createMockSSEResponse([
          sseToolCallChunk(
            [
              {
                index: 0,
                id: "call_m1",
                type: "function",
                function: { name: "search_hospitals", arguments: '{}' },
              },
            ],
            "tool_calls"
          ),
          sseDone(),
        ]);
      }
      return createMockSSEResponse([
        sseContentChunk("Final", "stop"),
        sseDone(),
      ]);
    });

    const result = await runAgentLoop(messages, toolSchemas, baseContext);

    // Messages should have been extended
    expect(result.messages.length).toBeGreaterThan(initialLen);
    // Original reference should have been mutated too
    expect(messages.length).toBeGreaterThan(initialLen);

    // Check for tool message in the messages
    const toolMessages = result.messages.filter((m) => m.role === "tool");
    expect(toolMessages.length).toBeGreaterThanOrEqual(1);
  });
});
