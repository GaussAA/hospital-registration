import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChatMessage, ToolContext } from "../../types";

/* ── Mock all dependencies ── */

// Mock ../tools/registry  (agent.ts imports: tools, toolsToFunctionCalling)
const mockToolHandler = vi.hoisted(() => vi.fn());
const mockTools = vi.hoisted(() => [
  {
    name: "search_hospitals",
    description: "搜索医院",
    parameters: { keyword: { type: "string", description: "关键词", required: true } },
    handler: mockToolHandler,
  },
  {
    name: "search_departments",
    description: "搜索科室",
    parameters: { hospitalId: { type: "string", description: "医院ID", required: true } },
    handler: mockToolHandler,
  },
]);

const mockToolsToFunctionCalling = vi.hoisted(() =>
  vi.fn().mockReturnValue([
    {
      type: "function",
      function: {
        name: "search_hospitals",
        description: "搜索医院",
        parameters: { type: "object", properties: {}, required: [] },
      },
    },
  ]),
);

vi.mock("../../tools/registry", () => ({
  default: mockTools,
  toolsToFunctionCalling: mockToolsToFunctionCalling,
  tools: mockTools,
}));

// Mock ../provider
const mockCompletion = vi.hoisted(() => vi.fn());
const mockIsProviderConfigured = vi.hoisted(() => vi.fn());
vi.mock("../provider", () => ({
  completion: mockCompletion,
  isProviderConfigured: mockIsProviderConfigured,
}));

// Mock ../prompts/system
const mockGetSystemPrompt = vi.hoisted(() => vi.fn().mockReturnValue("System prompt content"));
vi.mock("../../prompts/system", () => ({
  getSystemPrompt: mockGetSystemPrompt,
  SYSTEM_PROMPT: "System prompt content",
}));

// Import AFTER mocks
import { processMessage, buildSystemPromptWithUserContext, type AgentResult } from "../agent";

describe("agent.ts (processMessage)", () => {
  const baseContext: ToolContext = { userId: "user1", userRole: "patient" };
  const history: ChatMessage[] = [
    { role: "assistant", content: "您好！有什么可以帮助您的？" },
  ];

  beforeEach(() => {
    mockToolHandler.mockClear();
    mockToolsToFunctionCalling.mockClear();
    mockCompletion.mockClear();
    mockIsProviderConfigured.mockClear();
    mockGetSystemPrompt.mockClear();
  });

  /* ── Test: 空消息 ── */
  describe("empty message handling", () => {
    it("should return fallback for empty string", async () => {
      const result = await processMessage("", history, baseContext);
      expect(result.reply).toBe("请告诉我您需要什么帮助？");
    });

    it("should return fallback for whitespace-only string", async () => {
      const result = await processMessage("   \n  ", history, baseContext);
      expect(result.reply).toBe("请告诉我您需要什么帮助？");
    });

    it("should not call provider for empty message", async () => {
      await processMessage("", history, baseContext);
      expect(mockIsProviderConfigured).not.toHaveBeenCalled();
      expect(mockCompletion).not.toHaveBeenCalled();
    });

    it("should not include state in result for empty message", async () => {
      const result = await processMessage("", history, baseContext);
      expect(result.state).toBeUndefined();
    });
  });

  /* ── Test: 未配置provider时的fallback ── */
  describe("unconfigured provider fallback", () => {
    beforeEach(() => {
      mockIsProviderConfigured.mockReturnValue(false);
    });

    it("should return no-api-key response for registration-related queries", async () => {
      const queries = [
        "我想挂号",
        "预约医生",
        "找医院",
        "看科室",
        "内科医生",
      ];

      for (const query of queries) {
        const result = await processMessage(query, history, baseContext);
        expect(result.reply).toContain("AI服务尚未配置API密钥");
        expect(result.reply).toContain("AI_API_KEY");
      }
    });

    it("should return generic greeting for non-registration queries", async () => {
      const queries = ["你好", "在吗", "help", "天气怎么样"];

      for (const query of queries) {
        const result = await processMessage(query, history, baseContext);
        expect(result.reply).toContain("您好！我是AI挂号助手");
      }
    });

    it("should not attempt completion when provider not configured", async () => {
      await processMessage("我要挂号", history, baseContext);
      expect(mockCompletion).not.toHaveBeenCalled();
    });
  });

  /* ── Test: 正常调用 ── */
  describe("normal flow with configured provider", () => {
    beforeEach(() => {
      mockIsProviderConfigured.mockReturnValue(true);
    });

    it("should return the assistant reply from the agent loop", async () => {
      // Simulate: LLM returns content directly (no tool calls)
      mockCompletion.mockResolvedValue({
        content: "您好！请问您想挂哪个科室？",
        toolCalls: [],
      });

      const result = await processMessage("我想挂号", history, baseContext);
      expect(result.reply).toBe("您好！请问您想挂哪个科室？");
      expect(result.state).toBeUndefined();
    });

    it("should execute tool calls and return final response", async () => {
      // Round 1: tool call
      // Round 2: final response
      mockCompletion
        .mockResolvedValueOnce({
          content: "正在为您搜索医院...",
          toolCalls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "search_hospitals", arguments: '{"keyword":"人民医院"}' },
            },
          ],
        })
        .mockResolvedValueOnce({
          content: "找到以下医院：人民医院",
          toolCalls: [],
        });

      mockToolHandler.mockResolvedValue('[{"id":"h1","name":"人民医院"}]');

      const result = await processMessage("搜索人民医院", history, baseContext);
      expect(result.reply).toBe("找到以下医院：人民医院");
      expect(mockToolHandler).toHaveBeenCalledWith(
        { keyword: "人民医院" },
        baseContext
      );
      expect(mockCompletion).toHaveBeenCalledTimes(2);
    });

    it("should limit to 8 rounds of tool calling", async () => {
      // Always return tool calls (infinite loop scenario)
      mockCompletion.mockResolvedValue({
        content: "",
        toolCalls: [
          {
            id: "call_loop",
            type: "function",
            function: { name: "search_hospitals", arguments: "{}" },
          },
        ],
      });
      mockToolHandler.mockResolvedValue("result");

      const result = await processMessage("loop", history, baseContext);
      expect(mockCompletion).toHaveBeenCalledTimes(8);
      // After exhausting rounds, returns a summary message
      expect(result.reply).toBe("请问您还需要什么帮助？如果问题比较复杂，可以分段告诉我。");
    });

    it("should call toolsToFunctionCalling to get tool schemas", async () => {
      mockCompletion.mockResolvedValue({
        content: "hello",
        toolCalls: [],
      });

      await processMessage("hi", history, baseContext);
      expect(mockToolsToFunctionCalling).toHaveBeenCalled();
    });

    it("should include system prompt and limited history in messages", async () => {
      mockCompletion.mockResolvedValue({
        content: "ok",
        toolCalls: [],
      });

      const longHistory: ChatMessage[] = Array.from({ length: 25 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: `Message ${i}`,
      }));

      await processMessage("test", longHistory, baseContext);

      // Should only pass last 20 + system + user message
      const callArgs = mockCompletion.mock.calls[0][0];
      expect(callArgs.messages.length).toBeLessThanOrEqual(22); // system + 20 history + user
      expect(callArgs.messages[0].role).toBe("system");
      expect(callArgs.messages[callArgs.messages.length - 1].role).toBe("user");
    });
  });

  /* ── Test: 工具调用处理 ── */
  describe("tool call handling", () => {
    beforeEach(() => {
      mockIsProviderConfigured.mockReturnValue(true);
    });

    it("should handle unknown tool gracefully", async () => {
      mockCompletion
        .mockResolvedValueOnce({
          content: "",
          toolCalls: [
            {
              id: "call_unknown",
              type: "function",
              function: { name: "unknown_tool", arguments: "{}" },
            },
          ],
        })
        .mockResolvedValueOnce({
          content: "抱歉，我不认识这个工具",
          toolCalls: [],
        });

      const result = await processMessage("do something", history, baseContext);
      expect(result.reply).toBe("抱歉，我不认识这个工具");
    });

    it("should handle invalid tool arguments JSON", async () => {
      mockCompletion
        .mockResolvedValueOnce({
          content: "",
          toolCalls: [
            {
              id: "call_bad_args",
              type: "function",
              function: { name: "search_hospitals", arguments: "not valid json" },
            },
          ],
        })
        .mockResolvedValueOnce({
          content: "参数错误",
          toolCalls: [],
        });

      const result = await processMessage("search", history, baseContext);
      expect(result.reply).toBe("参数错误");
    });

    it("should handle the no_api_key_configured mock tool call", async () => {
      mockCompletion.mockResolvedValue({
        content: null,
        toolCalls: [
          {
            id: "mock-no-api-key",
            type: "function",
            function: { name: "no_api_key_configured", arguments: "{}" },
          },
        ],
      });

      const result = await processMessage("挂号", history, baseContext);
      expect(result.reply).toContain("AI服务尚未配置API密钥");
    });

    it("should handle empty assistant content after tool calls", async () => {
      mockCompletion.mockResolvedValue({
        content: "",
        toolCalls: [], // empty tool calls and empty content
      });

      const result = await processMessage("hello", history, baseContext);
      expect(result.reply).toBe("好的，请问还有什么可以帮您的？");
    });
  });

  /* ── Test: 错误处理 ── */
  describe("error handling", () => {
    beforeEach(() => {
      mockIsProviderConfigured.mockReturnValue(true);
    });

    it("should handle 401 API key error", async () => {
      mockCompletion.mockRejectedValue(new Error("401 Invalid API key"));

      const result = await processMessage("hi", history, baseContext);
      expect(result.reply).toContain("API 密钥无效或已过期");
    });

    it("should handle API key error in message", async () => {
      mockCompletion.mockRejectedValue(new Error("API key not valid"));

      const result = await processMessage("hi", history, baseContext);
      expect(result.reply).toContain("API 密钥无效或已过期");
    });

    it("should handle generic API error", async () => {
      mockCompletion.mockRejectedValue(new Error("Network failure"));

      const result = await processMessage("hi", history, baseContext);
      expect(result.reply).toContain("技术问题");
      expect(result.reply).toContain("稍后再试");
    });

    it("should handle non-Error thrown values", async () => {
      mockCompletion.mockRejectedValue("string error");

      const result = await processMessage("hi", history, baseContext);
      expect(result.reply).toContain("技术问题");
    });

    it("should console.error the error for debugging", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockCompletion.mockRejectedValue(new Error("test error"));

      await processMessage("hi", history, baseContext);

      expect(consoleSpy).toHaveBeenCalledWith("[AI Agent Error]", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  /* ── Test: AgentResult 类型 ── */
  describe("AgentResult type", () => {
    it("should return reply as string", async () => {
      mockIsProviderConfigured.mockReturnValue(false);
      const result = await processMessage("hi", history, baseContext);
      expect(typeof result.reply).toBe("string");
    });

    it("should satisfy the AgentResult interface", async () => {
      mockIsProviderConfigured.mockReturnValue(true);
      mockCompletion.mockResolvedValue({
        content: "response",
        toolCalls: [],
      });

      const result: AgentResult = await processMessage("hi", history, baseContext);
      expect(result.reply).toBe("response");
    });
  });
});

/* ── Test: buildSystemPromptWithUserContext ── */
describe("buildSystemPromptWithUserContext", () => {
  it("should call getSystemPrompt with user object", () => {
    const user = { name: "张三" };
    buildSystemPromptWithUserContext(user);
    expect(mockGetSystemPrompt).toHaveBeenCalledWith(user);
  });

  it("should call getSystemPrompt with undefined when no user provided", () => {
    buildSystemPromptWithUserContext();
    expect(mockGetSystemPrompt).toHaveBeenCalledWith(undefined);
  });

  it("should return the system prompt string", () => {
    const result = buildSystemPromptWithUserContext({ name: "李四" });
    expect(result).toBe("System prompt content");
  });

  it("should be a function", () => {
    expect(typeof buildSystemPromptWithUserContext).toBe("function");
  });
});
