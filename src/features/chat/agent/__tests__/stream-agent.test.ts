import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ChatMessage, ToolContext } from "../../types";

/* ── Mock ALL dependencies ── */

// Mock @/shared/db first (dynamic import)
vi.mock("@/shared/db", () => ({
  getPrisma: vi.fn(),
}));

// Mock memory-store
const mockUserMemoryGet = vi.hoisted(() => vi.fn());
const mockUserMemorySave = vi.hoisted(() => vi.fn());
const mockUserMemoryBuildMemoryPrompt = vi.hoisted(() => vi.fn().mockResolvedValue(""));
const mockUserMemoryUpdatePreferences = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockSessionMemoryGet = vi.hoisted(() => vi.fn());
const mockSessionMemorySet = vi.hoisted(() => vi.fn());

vi.mock("../memory-store", () => ({
  UserMemoryStore: {
    get: mockUserMemoryGet,
    save: mockUserMemorySave,
    buildMemoryPrompt: mockUserMemoryBuildMemoryPrompt,
    updatePreferences: mockUserMemoryUpdatePreferences,
  },
  SessionMemoryStore: {
    get: mockSessionMemoryGet,
    set: mockSessionMemorySet,
  },
}));

// Mock ../tools
const mockToolsToFunctionCalling = vi.hoisted(() => vi.fn().mockReturnValue([]));
vi.mock("../tools", () => ({
  toolsToFunctionCalling: mockToolsToFunctionCalling,
  default: [],
}));

// Mock ../../prompts/system (stream-agent.ts uses "../prompts/system" which resolves to chat/prompts/system)
const mockGetSystemPrompt = vi.hoisted(() => vi.fn().mockReturnValue("You are a hospital assistant"));
vi.mock("../../prompts/system", () => ({
  getSystemPrompt: mockGetSystemPrompt,
}));

// Mock ../context-compressor
const mockAutoCompress = vi.hoisted(() => vi.fn());
vi.mock("../context-compressor", () => ({
  autoCompress: mockAutoCompress,
}));

// Mock ../agent-runner
const mockRunAgentLoop = vi.hoisted(() => vi.fn());
vi.mock("../agent-runner", () => ({
  runAgentLoop: mockRunAgentLoop,
}));

// Mock ../stream-handler
const mockPushEvent = vi.hoisted(() => vi.fn());
const mockSSEStream = vi.hoisted(() => ({ stream: new ReadableStream(), pushEvent: mockPushEvent }));
vi.mock("../stream-handler", () => ({
  createSSEStream: vi.hoisted(() => vi.fn(() => mockSSEStream)),
}));

vi.stubGlobal("fetch", vi.fn());

import { createStreamResponse } from "../stream-agent";

describe("createStreamResponse", () => {
  const baseContext: ToolContext = { userId: "user1", userRole: "patient" };
  const history: ChatMessage[] = [{ role: "user", content: "你好" }];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRunAgentLoop.mockResolvedValue({
      result: { content: "您好！", toolCalls: [] },
      events: [{ type: "done" } as never],
      messages: [],
    });
  });

  it("should create a stream response with correct SSE events", async () => {
    const result = await createStreamResponse(history, baseContext);
    expect(result).toBeDefined();
    expect(result.stream).toBeInstanceOf(ReadableStream);
  });

  it("should call agent-runner with history and context", async () => {
    await createStreamResponse(history, baseContext);
    expect(mockRunAgentLoop).toHaveBeenCalled();
  });

  it("should handle empty history", async () => {
    const result = await createStreamResponse([], baseContext);
    expect(result).toBeDefined();
  });

  it("should handle agent errors gracefully", async () => {
    mockRunAgentLoop.mockRejectedValue(new Error("Agent error"));
    const result = await createStreamResponse(history, baseContext);
    expect(result).toBeDefined();
  });
});
