import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock global fetch ──────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Import after mocks ─────────────────────────────────────────────
import {
  completion,
  visionCompletion,
  isProviderConfigured,
} from "@/features/chat/agent/provider";

describe("agent/provider.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.AI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
  });

  // ── isProviderConfigured ──
  describe("isProviderConfigured", () => {
    it("should return false when no API keys are set", () => {
      expect(isProviderConfigured()).toBe(false);
    });

    it("should return true when AI_API_KEY is set", () => {
      process.env.AI_API_KEY = "sk-test-key";
      expect(isProviderConfigured()).toBe(true);
    });

    it("should return true when DEEPSEEK_API_KEY is set", () => {
      process.env.DEEPSEEK_API_KEY = "sk-deepseek-key";
      expect(isProviderConfigured()).toBe(true);
    });

    it("should prefer AI_API_KEY over DEEPSEEK_API_KEY", () => {
      process.env.AI_API_KEY = "sk-ai-key";
      process.env.DEEPSEEK_API_KEY = "sk-deepseek-key";
      expect(isProviderConfigured()).toBe(true);
    });
  });

  // ── completion (no API key) ──
  describe("completion without API key", () => {
    it("should return a mock tool call when no API key is configured", async () => {
      const result = await completion({
        messages: [{ role: "user", content: "你好" }],
      });

      expect(result.content).toBeNull();
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].function.name).toBe("no_api_key_configured");
    });
  });

  // ── completion (with API key) ──
  describe("completion with API key", () => {
    beforeEach(() => {
      process.env.AI_API_KEY = "sk-test-key";
      process.env.AI_BASE_URL = "https://api.test.com/v1";
      process.env.AI_MODEL = "test-model";
    });

    it("should send the correct request to the LLM API", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "您好！有什么可以帮您的？",
                tool_calls: [],
              },
            },
          ],
        }),
      });

      const result = await completion({
        messages: [{ role: "user", content: "你好" }],
      });

      expect(result.content).toBe("您好！有什么可以帮您的？");
      expect(result.toolCalls).toEqual([]);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-test-key",
          },
          body: expect.stringContaining("test-model"),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe("test-model");
      expect(body.messages).toEqual([{ role: "user", content: "你好" }]);
      expect(body.temperature).toBe(0.7);
      expect(body.max_tokens).toBe(4096);
      expect(body.stream).toBe(false);
    });

    it("should pass tools to the API when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: null, tool_calls: [] } }] }),
      });

      const tools = [
        {
          type: "function" as const,
          function: { name: "search_hospitals", description: "搜索医院", parameters: { type: "object" as const, properties: {}, required: [] } },
        },
      ];

      await completion({
        messages: [{ role: "user", content: "帮我找医院" }],
        tools,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tools).toEqual(tools);
    });

    it("should use custom temperature and maxTokens if provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "ok", tool_calls: [] } }] }),
      });

      await completion({
        messages: [{ role: "user", content: "hi" }],
        temperature: 0.1,
        maxTokens: 512,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.1);
      expect(body.max_tokens).toBe(512);
    });

    it("should handle tool calls in the response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: "call-1",
                    type: "function",
                    function: {
                      name: "search_hospitals",
                      arguments: '{"keyword":"人民医院"}',
                    },
                  },
                ],
              },
            },
          ],
        }),
      });

      const result = await completion({
        messages: [{ role: "user", content: "找人民医院" }],
      });

      expect(result.content).toBeNull();
      expect(result.toolCalls).toHaveLength(1);
      expect(result.toolCalls[0].function.name).toBe("search_hospitals");
      expect(result.toolCalls[0].function.arguments).toBe('{"keyword":"人民医院"}');
    });

    it("should handle API errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      await expect(
        completion({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("LLM API error (401): Unauthorized");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("fetch failed"));

      await expect(
        completion({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("fetch failed");
    });
  });

  // ── visionCompletion ──
  describe("visionCompletion", () => {
    it("should return error message when no API key is configured", async () => {
      const result = await visionCompletion(
        "https://example.com/image.jpg",
        "这是什么？"
      );

      expect(result).toBe("AI 视觉服务尚未配置 API 密钥，无法分析图片。");
    });

    it("should send vision request to the API", async () => {
      process.env.AI_API_KEY = "sk-test-key";
      process.env.AI_BASE_URL = "https://api.test.com/v1";

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "这是一张化验单，显示白细胞偏高。",
              },
            },
          ],
        }),
      });

      const result = await visionCompletion(
        "https://example.com/lab.jpg",
        "请分析这张化验单"
      );

      expect(result).toBe("这是一张化验单，显示白细胞偏高。");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0].content).toEqual([
        { type: "text", text: "请分析这张化验单" },
        { type: "image_url", image_url: { url: "https://example.com/lab.jpg" } },
      ]);
      expect(body.temperature).toBe(0.3);
      expect(body.max_tokens).toBe(2048);
    });

    it("should handle vision API errors", async () => {
      process.env.AI_API_KEY = "sk-test-key";

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      const result = await visionCompletion(
        "https://example.com/image.jpg",
        "分析图片"
      );

      expect(result).toContain("图片分析失败");
      expect(result).toContain("Vision API error (400): Bad Request");
    });

    it("should handle fetch failures gracefully", async () => {
      process.env.AI_API_KEY = "sk-test-key";

      mockFetch.mockRejectedValue(new Error("网络连接失败"));

      const result = await visionCompletion(
        "https://example.com/image.jpg",
        "分析图片"
      );

      expect(result).toBe("图片分析失败：网络连接失败");
    });
  });
});
