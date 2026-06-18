import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ────────────────────────────────────────────────────

const mockCreateMessage = vi.fn();

const mockPrisma = {
  message: {
    create: mockCreateMessage,
  },
};

vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(() => Promise.resolve(mockPrisma)),
}));

// ─── Import after mocks ─────────────────────────────────────────────

import { ConversationPersistence } from "../persistence";
import type { PersistAssistantMessage, PersistToolCall } from "../persistence";

// ─── Helpers ────────────────────────────────────────────────────────

const validAssistantMsg: PersistAssistantMessage = {
  content: "你好，有什么可以帮您？",
};

const validToolCalls: PersistToolCall[] = [
  {
    toolName: "search_hospital",
    arguments: '{"keyword":"协和"}',
    result: "找到 3 家医院",
    status: "success",
  },
];

// ─── Tests ──────────────────────────────────────────────────────────

describe("ConversationPersistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── saveAssistantResponse: success ──

  describe("saveAssistantResponse", () => {
    it("should save assistant message and return the id", async () => {
      mockCreateMessage.mockResolvedValue({ id: "msg-123" });

      const result = await ConversationPersistence.saveAssistantResponse(
        "conv-1",
        validAssistantMsg,
        []
      );

      expect(result).toBe("msg-123");
      expect(mockCreateMessage).toHaveBeenCalledTimes(1);
    });

    it("should pass conversationId, role 'assistant', and content to prisma", async () => {
      mockCreateMessage.mockResolvedValue({ id: "msg-456" });

      await ConversationPersistence.saveAssistantResponse(
        "conv-1",
        validAssistantMsg,
        []
      );

      expect(mockCreateMessage).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-1",
          role: "assistant",
          content: "你好，有什么可以帮您？",
          reasoningContent: null,
          toolCalls: {
            create: [],
          },
        },
      });
    });

    it("should save with tool calls including sequence numbers", async () => {
      mockCreateMessage.mockResolvedValue({ id: "msg-789" });

      await ConversationPersistence.saveAssistantResponse(
        "conv-1",
        validAssistantMsg,
        validToolCalls
      );

      expect(mockCreateMessage).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-1",
          role: "assistant",
          content: "你好，有什么可以帮您？",
          reasoningContent: null,
          toolCalls: {
            create: [
              {
                sequence: 0,
                toolName: "search_hospital",
                arguments: '{"keyword":"协和"}',
                result: "找到 3 家医院",
                status: "success",
              },
            ],
          },
        },
      });
    });

    it("should save with reasoningContent when provided", async () => {
      mockCreateMessage.mockResolvedValue({ id: "msg-reasoning" });

      const msgWithReasoning: PersistAssistantMessage = {
        content: "最终回复",
        reasoningContent: "思考过程",
      };

      await ConversationPersistence.saveAssistantResponse(
        "conv-1",
        msgWithReasoning,
        []
      );

      expect(mockCreateMessage).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-1",
          role: "assistant",
          content: "最终回复",
          reasoningContent: "思考过程",
          toolCalls: {
            create: [],
          },
        },
      });
    });

    it("should save with content as null when content is empty string", async () => {
      mockCreateMessage.mockResolvedValue({ id: "msg-empty" });

      const emptyMsg: PersistAssistantMessage = { content: "" };

      await ConversationPersistence.saveAssistantResponse(
        "conv-1",
        emptyMsg,
        []
      );

      expect(mockCreateMessage).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-1",
          role: "assistant",
          content: null,
          reasoningContent: null,
          toolCalls: {
            create: [],
          },
        },
      });
    });

    it("should assign sequential sequence numbers for multiple tool calls", async () => {
      mockCreateMessage.mockResolvedValue({ id: "msg-multi-tc" });

      const multiToolCalls: PersistToolCall[] = [
        {
          toolName: "tool_a",
          arguments: "{}",
          result: "result_a",
          status: "success",
        },
        {
          toolName: "tool_b",
          arguments: "{}",
          result: "result_b",
          status: "error",
        },
        {
          toolName: "tool_c",
          arguments: "{}",
          result: "result_c",
          status: "success",
        },
      ];

      await ConversationPersistence.saveAssistantResponse(
        "conv-1",
        validAssistantMsg,
        multiToolCalls
      );

      const createCall = mockCreateMessage.mock.calls[0][0];
      const toolCreates = createCall.data.toolCalls.create;
      expect(toolCreates).toHaveLength(3);
      expect(toolCreates[0].sequence).toBe(0);
      expect(toolCreates[1].sequence).toBe(1);
      expect(toolCreates[2].sequence).toBe(2);
      expect(toolCreates[0].toolName).toBe("tool_a");
      expect(toolCreates[1].toolName).toBe("tool_b");
      expect(toolCreates[2].toolName).toBe("tool_c");
    });

    // ── saveAssistantResponse: error paths ──

    it("should throw when prisma.message.create fails", async () => {
      const dbError = new Error("DB connection failed");
      mockCreateMessage.mockRejectedValue(dbError);

      await expect(
        ConversationPersistence.saveAssistantResponse(
          "conv-1",
          validAssistantMsg,
          []
        )
      ).rejects.toThrow("DB connection failed");
    });

    it("should throw when getPrisma fails", async () => {
      // Override the mock to make getPrisma fail
      const { getPrisma } = await import("@/shared/db");
      vi.mocked(getPrisma).mockRejectedValue(new Error("getPrisma failed"));

      await expect(
        ConversationPersistence.saveAssistantResponse(
          "conv-1",
          validAssistantMsg,
          []
        )
      ).rejects.toThrow("getPrisma failed");
    });

    it("should propagate prisma validation errors", async () => {
      const validationError = new Error(
        "Foreign key constraint failed on conversationId"
      );
      mockCreateMessage.mockRejectedValue(validationError);

      await expect(
        ConversationPersistence.saveAssistantResponse(
          "invalid-conv-id",
          validAssistantMsg,
          []
        )
      ).rejects.toThrow("Foreign key constraint failed on conversationId");
    });
  });
});
