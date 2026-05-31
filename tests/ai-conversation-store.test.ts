import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Prisma models ──
const mockConversationCreate = vi.fn();
const mockConversationFindFirst = vi.fn();
const mockConversationFindMany = vi.fn();
const mockConversationFindUnique = vi.fn();
const mockConversationUpdate = vi.fn();
const mockConversationDelete = vi.fn();
const mockMessageCreate = vi.fn();
const mockMessageCreateMany = vi.fn();

const mockPrisma = {
  conversation: {
    create: mockConversationCreate,
    findFirst: mockConversationFindFirst,
    findMany: mockConversationFindMany,
    findUnique: mockConversationFindUnique,
    update: mockConversationUpdate,
    delete: mockConversationDelete,
  },
  message: {
    create: mockMessageCreate,
    createMany: mockMessageCreateMany,
  },
};

// Mock @/lib/db before importing ConversationStore
vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(() => Promise.resolve(mockPrisma)),
}));

import { ConversationStore } from "@/lib/ai/conversation-store";

describe("ConversationStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── create ──
  describe("create", () => {
    it("should create a conversation and return its id", async () => {
      mockConversationCreate.mockResolvedValue({ id: "conv-1" });

      const id = await ConversationStore.create("session-abc");

      expect(id).toBe("conv-1");
      expect(mockConversationCreate).toHaveBeenCalledTimes(1);
      expect(mockConversationCreate).toHaveBeenCalledWith({
        data: { sessionId: "session-abc", userId: null, title: "新对话" },
      });
    });

    it("should accept an optional userId", async () => {
      mockConversationCreate.mockResolvedValue({ id: "conv-2" });

      const id = await ConversationStore.create("session-xyz", "user-42");

      expect(id).toBe("conv-2");
      expect(mockConversationCreate).toHaveBeenCalledWith({
        data: { sessionId: "session-xyz", userId: "user-42", title: "新对话" },
      });
    });
  });

  // ── getOrCreate ──
  describe("getOrCreate", () => {
    it("should return existing conversation id when one exists", async () => {
      mockConversationFindFirst.mockResolvedValue({ id: "existing-conv" });

      const id = await ConversationStore.getOrCreate("session-abc");

      expect(id).toBe("existing-conv");
      expect(mockConversationFindFirst).toHaveBeenCalledWith({
        where: { sessionId: "session-abc" },
        orderBy: { updatedAt: "desc" },
      });
      expect(mockConversationCreate).not.toHaveBeenCalled();
    });

    it("should create a new conversation when none exists", async () => {
      mockConversationFindFirst.mockResolvedValue(null);
      mockConversationCreate.mockResolvedValue({ id: "new-conv" });

      const id = await ConversationStore.getOrCreate("session-new");

      expect(id).toBe("new-conv");
      expect(mockConversationFindFirst).toHaveBeenCalled();
      expect(mockConversationCreate).toHaveBeenCalledWith({
        data: { sessionId: "session-new", userId: null, title: "新对话" },
      });
    });
  });

  // ── addMessage (single) ──
  describe("addMessage", () => {
    it("should add a single message and return its id", async () => {
      mockMessageCreate.mockResolvedValue({ id: "msg-1" });

      const msgId = await ConversationStore.addMessage(
        "conv-1",
        "user",
        "你好"
      );

      expect(msgId).toBe("msg-1");
      expect(mockMessageCreate).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-1",
          role: "user",
          content: "你好",
          toolCalls: null,
        },
      });
    });

    it("should accept optional toolCalls", async () => {
      mockMessageCreate.mockResolvedValue({ id: "msg-2" });

      await ConversationStore.addMessage(
        "conv-1",
        "assistant",
        "正在查询",
        '[{"name":"search","args":{}}]'
      );

      expect(mockMessageCreate).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-1",
          role: "assistant",
          content: "正在查询",
          toolCalls: '[{"name":"search","args":{}}]',
        },
      });
    });

    it("should handle null content", async () => {
      mockMessageCreate.mockResolvedValue({ id: "msg-3" });

      await ConversationStore.addMessage("conv-1", "tool", null);

      expect(mockMessageCreate).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-1",
          role: "tool",
          content: null,
          toolCalls: null,
        },
      });
    });
  });

  // ── addMessages (batch) ──
  describe("addMessages", () => {
    it("should batch add multiple messages", async () => {
      mockMessageCreateMany.mockResolvedValue({ count: 2 });

      await ConversationStore.addMessages("conv-1", [
        { role: "user", content: "你好" },
        { role: "assistant", content: "您好！有什么可以帮您的？" },
      ]);

      expect(mockMessageCreateMany).toHaveBeenCalledWith({
        data: [
          {
            conversationId: "conv-1",
            role: "user",
            content: "你好",
            toolCalls: null,
          },
          {
            conversationId: "conv-1",
            role: "assistant",
            content: "您好！有什么可以帮您的？",
            toolCalls: null,
          },
        ],
      });
    });

    it("should handle empty messages array", async () => {
      mockMessageCreateMany.mockResolvedValue({ count: 0 });

      await ConversationStore.addMessages("conv-1", []);

      expect(mockMessageCreateMany).toHaveBeenCalledWith({
        data: [],
      });
    });
  });

  // ── list ──
  describe("list", () => {
    it("should return conversation summaries for a session", async () => {
      mockConversationFindMany.mockResolvedValue([
        {
          id: "conv-1",
          title: "对话1",
          _count: { messages: 3 },
          updatedAt: new Date("2024-01-03T00:00:00Z"),
        },
        {
          id: "conv-2",
          title: "对话2",
          _count: { messages: 1 },
          updatedAt: new Date("2024-01-02T00:00:00Z"),
        },
      ]);

      const result = await ConversationStore.list("session-abc");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "conv-1",
        title: "对话1",
        messageCount: 3,
        updatedAt: "2024-01-03T00:00:00.000Z",
      });
      expect(result[1]).toEqual({
        id: "conv-2",
        title: "对话2",
        messageCount: 1,
        updatedAt: "2024-01-02T00:00:00.000Z",
      });
      expect(mockConversationFindMany).toHaveBeenCalledWith({
        where: { sessionId: "session-abc" },
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { messages: true } } },
      });
    });

    it("should filter by userId when provided", async () => {
      mockConversationFindMany.mockResolvedValue([]);

      await ConversationStore.list("session-abc", "user-42");

      expect(mockConversationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: "session-abc", userId: "user-42" },
        })
      );
    });

    it("should return empty array when no conversations exist", async () => {
      mockConversationFindMany.mockResolvedValue([]);

      const result = await ConversationStore.list("session-empty");

      expect(result).toEqual([]);
    });
  });

  // ── getDetail ──
  describe("getDetail", () => {
    it("should return conversation detail with messages sorted by createdAt asc", async () => {
      mockConversationFindUnique.mockResolvedValue({
        id: "conv-1",
        title: "对话1",
        messages: [
          {
            id: "msg-1",
            role: "user",
            content: "你好",
            toolCalls: null,
            createdAt: new Date("2024-01-01T00:00:00Z"),
          },
          {
            id: "msg-2",
            role: "assistant",
            content: "您好！",
            toolCalls: null,
            createdAt: new Date("2024-01-01T00:00:01Z"),
          },
        ],
      });

      const detail = await ConversationStore.getDetail("conv-1");

      expect(detail).not.toBeNull();
      expect(detail!.id).toBe("conv-1");
      expect(detail!.title).toBe("对话1");
      expect(detail!.messages).toHaveLength(2);
      expect(detail!.messages[0]).toEqual({
        id: "msg-1",
        role: "user",
        content: "你好",
        toolCalls: null,
        createdAt: "2024-01-01T00:00:00.000Z",
      });
      expect(mockConversationFindUnique).toHaveBeenCalledWith({
        where: { id: "conv-1" },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    it("should return null when conversation not found", async () => {
      mockConversationFindUnique.mockResolvedValue(null);

      const detail = await ConversationStore.getDetail("non-existent");

      expect(detail).toBeNull();
    });
  });

  // ── updateTitle ──
  describe("updateTitle", () => {
    it("should update conversation title", async () => {
      mockConversationUpdate.mockResolvedValue({ id: "conv-1" });

      await ConversationStore.updateTitle("conv-1", "新标题");

      expect(mockConversationUpdate).toHaveBeenCalledWith({
        where: { id: "conv-1" },
        data: { title: "新标题" },
      });
    });
  });

  // ── remove ──
  describe("remove", () => {
    it("should delete a conversation", async () => {
      mockConversationDelete.mockResolvedValue({ id: "conv-1" });

      await ConversationStore.remove("conv-1");

      expect(mockConversationDelete).toHaveBeenCalledWith({
        where: { id: "conv-1" },
      });
    });

    it("should throw when conversation does not exist", async () => {
      mockConversationDelete.mockRejectedValue(
        new Error("Record to delete does not exist")
      );

      await expect(ConversationStore.remove("non-existent")).rejects.toThrow(
        "Record to delete does not exist"
      );
    });
  });

  // ── mergeToUser ──
  describe("mergeToUser", () => {
    it("should throw Not implemented error (P1 feature)", async () => {
      await expect(
        ConversationStore.mergeToUser("session-1", "user-1")
      ).rejects.toThrow("Not implemented: mergeToUser is a P1 feature");
    });
  });
});
