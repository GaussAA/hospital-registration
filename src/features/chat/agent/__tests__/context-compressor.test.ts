import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  estimateTokens,
  compressMessages,
  autoCompress,
} from "../context-compressor";
import type { ChatMessage } from "../../types";

// ─── Helpers ────────────────────────────────────────────────────────

function makeMsg(
  role: ChatMessage["role"],
  content: string | null
): ChatMessage {
  return { role, content };
}

const systemMsg = makeMsg("system", "你是医疗助手");
const userMsg = (content: string) => makeMsg("user", content);
const assistantMsg = (content: string) => makeMsg("assistant", content);

// ─── estimateTokens ─────────────────────────────────────────────────

describe("estimateTokens", () => {
  it("should estimate ~2 tokens per CJK character", () => {
    const result = estimateTokens("你好世界");
    expect(result).toBe(8); // 4 CJK chars × 2
  });

  it("should estimate ~0.3 tokens per non-CJK character", () => {
    const result = estimateTokens("hello");
    expect(result).toBe(2); // 5 chars × 0.3 = 1.5 → ceil(1.5) = 2
  });

  it("should estimate mixed CJK and ASCII correctly", () => {
    const result = estimateTokens("你好abc");
    // "你好" → 4, "abc" → 3 × 0.3 = 0.9 → ceil(0.9) = 1, total = 5
    expect(result).toBe(5);
  });

  it("should return 1 for an empty string (Math.ceil(0))", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("should handle CJK extension blocks (U+3400–U+4DBF)", () => {
    // 𒀀 is U+13000, which is not in the ranges — should be non-CJK
    const result = estimateTokens("\u3400"); // CJK Extension A
    expect(result).toBe(2);
  });

  it("should handle CJK Compatibility (U+F900–U+FAFF)", () => {
    const result = estimateTokens("\uF900"); // CJK Compatibility
    expect(result).toBe(2);
  });

  it("should handle long string with rounding", () => {
    // 10 ASCII chars × 0.3 = 3.0 → Math.ceil(3.0) = 3
    const result = estimateTokens("a".repeat(10));
    expect(result).toBe(3);
  });
});

// ─── compressMessages ───────────────────────────────────────────────

describe("compressMessages", () => {
  it("should return messages as-is when count <= 30", () => {
    const msgs = Array.from({ length: 25 }, (_, i) => userMsg(`msg-${i}`));
    expect(compressMessages(msgs)).toBe(msgs);
  });

  it("should return messages as-is when count is exactly 30", () => {
    const msgs = Array.from({ length: 30 }, (_, i) => userMsg(`msg-${i}`));
    expect(compressMessages(msgs)).toBe(msgs);
  });

  it("should compress when count > 30", () => {
    const msgs: ChatMessage[] = [
      systemMsg,
      ...Array.from({ length: 35 }, (_, i) => userMsg(`用户查询${i}`)),
    ];
    const result = compressMessages(msgs);

    // Should have system message + compressed summary + recent messages
    expect(result.length).toBeLessThan(msgs.length);
    // System messages should be preserved
    expect(result.filter((m) => m.role === "system").length).toBeGreaterThanOrEqual(1);
  });

  it("should preserve the system message at the front", () => {
    const msgs: ChatMessage[] = [
      systemMsg,
      ...Array.from({ length: 35 }, (_, i) => userMsg(`query-${i}`)),
    ];
    const result = compressMessages(msgs);
    const resultSystemMsgs = result.filter((m) => m.role === "system");
    expect(resultSystemMsgs.some((m) => m.content === systemMsg.content)).toBe(true);
  });

  it("should keep recent messages intact (no CJK abbreviated content)", () => {
    const msgs: ChatMessage[] = Array.from({ length: 35 }, (_, i) =>
      userMsg(`last-msg-${i}`)
    );
    const result = compressMessages(msgs);
    // The last 10 non-system messages should appear as complete user messages
    // (content should start with their original text, not "问:" or "答:")
    const lastMsgs = result.filter((m) => m.role !== "system");
    const recentContent = lastMsgs
      .slice(-5)
      .map((m) => m.content)
      .join("");
    expect(recentContent).toContain("last-msg-"); // original content preserved
  });

  it("should create a summary with CJK prefix for compressed messages", () => {
    const msgs: ChatMessage[] = Array.from({ length: 35 }, (_, i) =>
      userMsg(`query-${i}`)
    );
    const result = compressMessages(msgs);
    const summary = result.find(
      (m) => m.role === "system" && m.content?.includes("历史对话")
    );
    expect(summary).toBeDefined();
    expect(summary!.content).toContain("[以下为");
    expect(summary!.content).toContain("轮历史对话的摘要]");
  });

  it("should limit the result to 60 messages maximum", () => {
    const msgs: ChatMessage[] = Array.from({ length: 100 }, (_, i) =>
      userMsg(`query-${i}`)
    );
    const result = compressMessages(msgs);
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it("should handle assistant messages in summary", () => {
    // Only assistant messages (no user messages)
    const msgs: ChatMessage[] = Array.from({ length: 35 }, (_, i) =>
      assistantMsg(`assistant-reply-${i}`)
    );
    const result = compressMessages(msgs);
    const summary = result.find(
      (m) => m.role === "system" && m.content?.includes("历史对话")
    );
    expect(summary).toBeDefined();
    expect(summary!.content).toContain("答:");
  });

  it("should truncate long user content (>100 chars) in summary", () => {
    const msgs: ChatMessage[] = [
      userMsg("a".repeat(150)),
      ...Array.from({ length: 34 }, (_, i) => userMsg(`query-${i}`)),
    ];
    const result = compressMessages(msgs);
    const summary = result.find(
      (m) => m.role === "system" && m.content?.includes("历史对话")
    );
    expect(summary).toBeDefined();
    expect(summary!.content).toContain("…");
  });

  it("should truncate long assistant content (>200 chars) in summary", () => {
    const msgs: ChatMessage[] = [
      assistantMsg("b".repeat(250)),
      ...Array.from({ length: 34 }, (_, i) => userMsg(`query-${i}`)),
    ];
    const result = compressMessages(msgs);
    const summary = result.find(
      (m) => m.role === "system" && m.content?.includes("历史对话")
    );
    expect(summary).toBeDefined();
    expect(summary!.content).toContain("…");
  });

  it("should include tool messages in summary with '系统:' prefix", () => {
    const msgs: ChatMessage[] = [
      makeMsg("tool", "挂号成功"),
      ...Array.from({ length: 34 }, (_, i) => userMsg(`query-${i}`)),
    ];
    const result = compressMessages(msgs);
    const summary = result.find(
      (m) => m.role === "system" && m.content?.includes("历史对话")
    );
    expect(summary).toBeDefined();
    expect(summary!.content).toContain("系统:");
  });

  it("should truncate tool content (>150 chars) in summary", () => {
    const msgs: ChatMessage[] = [
      makeMsg("tool", "c".repeat(200)),
      ...Array.from({ length: 34 }, (_, i) => userMsg(`query-${i}`)),
    ];
    const result = compressMessages(msgs);
    const summary = result.find(
      (m) => m.role === "system" && m.content?.includes("历史对话")
    );
    expect(summary).toBeDefined();
    expect(summary!.content).toContain("…");
  });

  it("should truncate summary itself when exceeds MAX_COMPRESSED_CONTEXT_LENGTH (2000)", () => {
    // Create extremely verbose messages that will overflow the summary
    const longContent = "x".repeat(300);
    const msgs: ChatMessage[] = [];
    for (let i = 0; i < 35; i++) {
      msgs.push(userMsg(longContent));
    }
    const result = compressMessages(msgs);
    const summary = result.find(
      (m) => m.role === "system" && m.content?.includes("历史对话")
    );
    expect(summary).toBeDefined();
    expect(summary!.content!.length).toBeLessThan(2200); // 2000 + some suffix chars
    expect(summary!.content).toContain("[中间上下文已压缩]");
  });

  it("should handle null content in messages", () => {
    const msgs: ChatMessage[] = [
      { role: "user", content: null },
      ...Array.from({ length: 34 }, (_, i) => userMsg(`query-${i}`)),
    ];
    // Should not throw
    expect(() => compressMessages(msgs)).not.toThrow();
  });
});

// ─── autoCompress ───────────────────────────────────────────────────

describe("autoCompress", () => {
  const defaultMaxTokens = 12000;

  it("should return messages as-is when within token limit", () => {
    const msgs: ChatMessage[] = [userMsg("hello")];
    const result = autoCompress(msgs, defaultMaxTokens);
    expect(result).toBe(msgs);
  });

  it("should compress when total tokens exceed limit", () => {
    // ~2 tokens per CJK char → 5000 CJK chars × 2 = 10000 tokens, under 12000
    // But more messages would push it over
    const msgs: ChatMessage[] = Array.from({ length: 35 }, (_, i) =>
      userMsg("你好".repeat(100))
    );
    const result = autoCompress(msgs, defaultMaxTokens);
    // Should have compressed
    const totalTokens = result.reduce(
      (sum, m) => sum + estimateTokens(m.content || ""),
      0
    );
    expect(totalTokens).toBeLessThanOrEqual(defaultMaxTokens);
  });

  it("should not compress when within a small token limit with short messages", () => {
    const msgs: ChatMessage[] = Array.from({ length: 5 }, (_, i) =>
      userMsg("hi")
    );
    const result = autoCompress(msgs, 100);
    expect(result).toBe(msgs);
  });

  it("should handle empty message array", () => {
    const result = autoCompress([], defaultMaxTokens);
    expect(result).toEqual([]);
  });

  it("should stop after 3 rounds of compression", () => {
    // Many messages with long content to force multiple compression rounds
    const msgs: ChatMessage[] = Array.from({ length: 100 }, (_, i) =>
      userMsg("你好".repeat(500))
    );
    const result = autoCompress(msgs, 100); // Very low limit to force max rounds
    // Even if tokens still exceed limit, it should return after 3 rounds
    expect(result.length).toBeLessThan(msgs.length);
  });

  it("should use default maxTokens of 12000 when not specified", () => {
    const msgs: ChatMessage[] = [userMsg("hello")];
    const result = autoCompress(msgs);
    expect(result).toBe(msgs);
  });

  it("should not throw with null content in messages", () => {
    const msgs: ChatMessage[] = [
      { role: "user", content: null },
      ...Array.from({ length: 30 }, (_, i) => userMsg("你好")),
    ];
    expect(() => autoCompress(msgs, 1000)).not.toThrow();
  });
});
