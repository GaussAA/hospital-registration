import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mock factories (necessary because vi.mock is hoisted to top of file) ──
const {
  mockAddMessage,
  mockGetOrCreate,
  mockGetDetail,
  mockAddMessages,
  mockUpdateTitle,
  mockVerifyToken,
  mockSaveAssistantResponse,
} = vi.hoisted(() => ({
  mockAddMessage: vi.fn(),
  mockGetOrCreate: vi.fn(),
  mockGetDetail: vi.fn(),
  mockAddMessages: vi.fn(),
  mockUpdateTitle: vi.fn(),
  mockVerifyToken: vi.fn(),
  mockSaveAssistantResponse: vi.fn(() => Promise.resolve("msg-assistant-1")),
}));

vi.mock("@/features/chat/agent/conversation-store", () => ({
  ConversationStore: {
    addMessage: mockAddMessage,
    getOrCreate: mockGetOrCreate,
    getDetail: mockGetDetail,
    addMessages: mockAddMessages,
    updateTitle: mockUpdateTitle,
    create: vi.fn(() => Promise.resolve("conv-42")),
    loadHistoryAsChatMessages: vi.fn(() => Promise.resolve([])),
    generateSmartTitle: vi.fn(() => "测试对话"),
  },
}));

// Mock persistence layer
vi.mock("@/features/chat/agent/persistence", () => ({
  ConversationPersistence: {
    saveAssistantResponse: mockSaveAssistantResponse,
  },
}));

vi.mock("@/shared/utils/jwt", () => ({
  verifyToken: mockVerifyToken,
}));

// Mock agent stream response
vi.mock("@/features/chat/agent/stream-agent", () => ({
  createStreamResponse: vi.fn(() => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("0:AI回复内容\n"));
        controller.enqueue(encoder.encode("e:finish\n\n"));
        controller.close();
      },
    });
    return Promise.resolve({
      stream,
      promise: Promise.resolve({
        content: "AI回复内容",
        reasoningContent: "",
        toolCalls: [],
      }),
    });
  }),
}));

import { POST } from "@/app/api/chat/stream/route";

interface RequestWithMockCookies extends Request {
  cookies: { get: (name: string) => { value: string } | undefined };
}

/**
 * Helper: create a minimal Request-like object matching what the handler expects.
 */
function createMockRequest({
  body = {},
  headers = {},
  cookieToken,
}: {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  cookieToken?: string;
}): RequestWithMockCookies {
  const req = new Request("http://localhost:3000/api/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  // Mock cookies.get for JWT token
  const cookiesGet = vi.fn(() =>
    cookieToken ? { value: cookieToken } : undefined
  );

  Object.defineProperty(req, "cookies", {
    value: { get: cookiesGet },
    writable: true,
  });

  return req as RequestWithMockCookies;
}

describe("POST /api/chat/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation", () => {
    it("should return 400 when message is missing", async () => {
      const req = createMockRequest({ body: {} });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("消息不能为空");
    });

    it("should return 400 when message is empty string", async () => {
      const req = createMockRequest({ body: { message: "" } });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("消息不能为空");
    });

    it("should return 400 when message is only whitespace", async () => {
      const req = createMockRequest({ body: { message: "   " } });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("消息不能为空");
    });

    it("should return 400 when message is not a string", async () => {
      const req = createMockRequest({ body: { message: 123 } });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe("response format", () => {
    beforeEach(() => {
      mockGetOrCreate.mockResolvedValue("conv-42");
      mockAddMessage.mockResolvedValue("msg-1");
      mockGetDetail.mockResolvedValue({
        id: "conv-42",
        title: "新对话",
        messages: [],
      });
    });

    it("should return SSE Content-Type header", async () => {
      const req = createMockRequest({
        body: { message: "你好" },
        headers: { "x-session-id": "test-session" },
      });

      const res = await POST(req);

      expect(res.headers.get("Content-Type")).toBe("text/event-stream");
      expect(res.headers.get("Cache-Control")).toBe("no-cache");
      expect(res.headers.get("Connection")).toBe("keep-alive");
    });

    it("should include x-conversation-id header", async () => {
      const req = createMockRequest({
        body: { message: "你好" },
        headers: { "x-session-id": "test-session" },
      });

      const res = await POST(req);

      expect(res.headers.get("x-conversation-id")).toBe("conv-42");
    });

    it("should use existing conversationId when provided", async () => {
      mockGetDetail.mockResolvedValue({
        id: "existing-conv",
        title: "已有对话",
        messages: [
          {
            role: "user",
            content: "之前的问题",
            id: "m1",
            toolCalls: null,
            createdAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      });

      const req = createMockRequest({
        body: { message: "新问题", conversationId: "existing-conv" },
        headers: { "x-session-id": "test-session" },
      });

      const res = await POST(req);

      // When existingConvId is provided, getOrCreate should NOT be called
      expect(mockGetOrCreate).not.toHaveBeenCalled();
      // Message should still be saved to the existing conversation
      expect(mockAddMessage).toHaveBeenCalledWith(
        "existing-conv",
        "user",
        "新问题"
      );
      expect(res.headers.get("x-conversation-id")).toBe("existing-conv");
    });
  });

  describe("stream output", () => {
    beforeEach(() => {
      mockGetOrCreate.mockResolvedValue("conv-42");
      mockAddMessage.mockResolvedValue("msg-1");
      mockGetDetail.mockResolvedValue({
        id: "conv-42",
        title: "新对话",
        messages: [],
      });
    });

    it("should produce valid SSE chunks", async () => {
      const req = createMockRequest({
        body: { message: "你好" },
        headers: { "x-session-id": "test-session" },
      });

      const res = await POST(req);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let allText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        allText += decoder.decode(value);
      }

      // Should contain AI SDK format text chunks
      expect(allText).toContain("0:");
      // Should contain finish event
      expect(allText).toContain("e:finish");
      // Should contain conversationId in the data line
      expect(allText).toContain("conv-42");
    });

    it("should persist assistant message after stream completes", async () => {
      const req = createMockRequest({
        body: { message: "你好" },
        headers: { "x-session-id": "test-session" },
      });

      const res = await POST(req);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        decoder.decode(value);
      }

      // After stream completion, saveAssistantResponse should have been called
      expect(mockSaveAssistantResponse).toHaveBeenCalledTimes(1);
      const saveCall = mockSaveAssistantResponse.mock.calls[0];
      expect(saveCall[0]).toBe("conv-42");
      expect(saveCall[1].content).toBeTruthy();
    });
  });

  describe("error handling", () => {
    it("should return 500 when an unexpected error occurs", async () => {
      // Force an error by making addMessage throw
      mockAddMessage.mockRejectedValue(new Error("数据库连接失败"));

      const req = createMockRequest({
        body: { message: "你好" },
        headers: { "x-session-id": "test-session" },
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toContain("数据库连接失败");
    });
  });
});
