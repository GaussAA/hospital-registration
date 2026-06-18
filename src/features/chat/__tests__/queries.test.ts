import { describe, it, expect, vi, beforeEach } from "vitest";

const mockList = vi.fn();
const mockGetDetail = vi.fn();
const mockLoadHistory = vi.fn();
const mockGetOrCreate = vi.fn();

vi.mock("../agent/conversation-store", () => ({
  ConversationStore: {
    list: mockList,
    getDetail: mockGetDetail,
    loadHistoryAsChatMessages: mockLoadHistory,
    getOrCreate: mockGetOrCreate,
  },
}));

const { listConversations, getConversation, loadConversationHistory, getOrCreateConversation } = await import("../queries");

const mockConversations = [
  { id: "conv-1", title: "挂号咨询", messageCount: 5, createdAt: new Date(), updatedAt: new Date() },
];

const mockDetail = {
  id: "conv-1",
  title: "挂号咨询",
  messages: [{ role: "user" as const, content: "你好" }],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockChatMessages = [
  { role: "user" as const, content: "你好" },
  { role: "assistant" as const, content: "您好！" },
];

describe("chat queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listConversations", () => {
    it("should return conversation list", async () => {
      mockList.mockResolvedValue(mockConversations);
      const result = await listConversations("ses-1", "user-1");
      expect(mockList).toHaveBeenCalledWith("ses-1", "user-1");
      expect(result).toEqual(mockConversations);
    });

    it("should work without userId", async () => {
      mockList.mockResolvedValue([]);
      const result = await listConversations("ses-2");
      expect(mockList).toHaveBeenCalledWith("ses-2", undefined);
      expect(result).toEqual([]);
    });
  });

  describe("getConversation", () => {
    it("should return conversation detail", async () => {
      mockGetDetail.mockResolvedValue(mockDetail);
      const result = await getConversation("conv-1");
      expect(mockGetDetail).toHaveBeenCalledWith("conv-1");
      expect(result).toEqual(mockDetail);
    });

    it("should return null when not found", async () => {
      mockGetDetail.mockResolvedValue(null);
      const result = await getConversation("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("loadConversationHistory", () => {
    it("should load history with default max messages", async () => {
      mockLoadHistory.mockResolvedValue(mockChatMessages);
      const result = await loadConversationHistory("conv-1");
      expect(mockLoadHistory).toHaveBeenCalledWith("conv-1", 40);
      expect(result).toEqual(mockChatMessages);
    });

    it("should load history with custom max messages", async () => {
      mockLoadHistory.mockResolvedValue(mockChatMessages);
      const result = await loadConversationHistory("conv-1", 10);
      expect(mockLoadHistory).toHaveBeenCalledWith("conv-1", 10);
      expect(result).toEqual(mockChatMessages);
    });

    it("should return empty array when no history", async () => {
      mockLoadHistory.mockResolvedValue([]);
      const result = await loadConversationHistory("conv-empty", 5);
      expect(result).toEqual([]);
    });
  });

  describe("getOrCreateConversation", () => {
    it("should return existing or new conversation id", async () => {
      mockGetOrCreate.mockResolvedValue("conv-1");
      const result = await getOrCreateConversation("ses-1", "user-1");
      expect(mockGetOrCreate).toHaveBeenCalledWith("ses-1", "user-1");
      expect(result).toBe("conv-1");
    });

    it("should work without userId", async () => {
      mockGetOrCreate.mockResolvedValue("conv-2");
      const result = await getOrCreateConversation("ses-2");
      expect(mockGetOrCreate).toHaveBeenCalledWith("ses-2", undefined);
      expect(result).toBe("conv-2");
    });
  });
});
