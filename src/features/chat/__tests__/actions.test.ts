import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateStreamResponse = vi.fn();
const mockConversationCreate = vi.fn();
const mockConversationRemove = vi.fn();
const mockSaveAssistantResponse = vi.fn();

vi.mock("../agent/stream-agent", () => ({
  createStreamResponse: mockCreateStreamResponse,
}));

vi.mock("../agent/conversation-store", () => ({
  ConversationStore: {
    create: mockConversationCreate,
    remove: mockConversationRemove,
  },
}));

vi.mock("../agent/persistence", () => ({
  ConversationPersistence: {
    saveAssistantResponse: mockSaveAssistantResponse,
  },
}));

const { streamChat, createConversation, deleteConversation, persistAssistantResponse } = await import("../actions");

describe("chat actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("streamChat", () => {
    it("should delegate to createStreamResponse", async () => {
      const mockResult = { stream: new ReadableStream(), promise: Promise.resolve() };
      mockCreateStreamResponse.mockResolvedValue(mockResult);

      const messages = [{ role: "user", content: "hello" }] as import("./types").ChatMessage[];
      const context = { sessionId: "ses-1" } as import("./types").ToolContext;

      const result = await streamChat(messages, context);
      expect(mockCreateStreamResponse).toHaveBeenCalledWith(messages, context);
      expect(result).toBe(mockResult);
    });
  });

  describe("createConversation", () => {
    it("should delegate to ConversationStore.create", async () => {
      mockConversationCreate.mockResolvedValue("conv-1");
      const result = await createConversation("ses-1", "user-1");
      expect(mockConversationCreate).toHaveBeenCalledWith("ses-1", "user-1");
      expect(result).toBe("conv-1");
    });

    it("should work without userId", async () => {
      mockConversationCreate.mockResolvedValue("conv-2");
      const result = await createConversation("ses-2");
      expect(mockConversationCreate).toHaveBeenCalledWith("ses-2", undefined);
      expect(result).toBe("conv-2");
    });
  });

  describe("deleteConversation", () => {
    it("should delegate to ConversationStore.remove", async () => {
      mockConversationRemove.mockResolvedValue(undefined);
      await deleteConversation("conv-1");
      expect(mockConversationRemove).toHaveBeenCalledWith("conv-1");
    });
  });

  describe("persistAssistantResponse", () => {
    it("should delegate to ConversationPersistence.saveAssistantResponse", async () => {
      mockSaveAssistantResponse.mockResolvedValue("msg-1");

      const toolCalls = [
        { toolName: "searchHospital", arguments: '{"q":"test"}', result: "ok", status: "success" },
      ];

      const result = await persistAssistantResponse("conv-1", "Hello!", toolCalls, "thinking...");

      expect(mockSaveAssistantResponse).toHaveBeenCalledWith(
        "conv-1",
        { content: "Hello!", reasoningContent: "thinking..." },
        toolCalls,
      );
      expect(result).toBe("msg-1");
    });

    it("should work without reasoningContent", async () => {
      mockSaveAssistantResponse.mockResolvedValue("msg-2");

      const result = await persistAssistantResponse("conv-2", "Hi!", []);

      expect(mockSaveAssistantResponse).toHaveBeenCalledWith(
        "conv-2",
        { content: "Hi!", reasoningContent: undefined },
        [],
      );
      expect(result).toBe("msg-2");
    });
  });
});
