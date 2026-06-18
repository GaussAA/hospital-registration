import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSSEStream } from "../stream-handler";
import type { AgentEvent } from "../agent-runner";

// ─── Helper: read all chunks from a ReadableStream ─────────────────

async function readAllChunks(
  stream: ReadableStream<Uint8Array>
): Promise<string[]> {
  const reader = stream.getReader();
  const chunks: string[] = [];
  const decoder = new TextDecoder();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value, { stream: true }));
  }
  return chunks;
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("createSSEStream", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return an object with stream and pushEvent", () => {
    const result = createSSEStream();
    expect(result).toHaveProperty("stream");
    expect(result).toHaveProperty("pushEvent");
    expect(result.stream).toBeInstanceOf(ReadableStream);
    expect(typeof result.pushEvent).toBe("function");
  });

  // ── text event ──

  it("should encode text events as '0:content\\n'", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "text", content: "你好" });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe(`0:${JSON.stringify("你好")}\ne:finish\n`);
  });

  it("should handle multiple text chunks", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "text", content: "Hello" });
    pushEvent({ type: "text", content: " World" });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe(
      `0:${JSON.stringify("Hello")}\n0:${JSON.stringify(" World")}\ne:finish\n`
    );
  });

  // ── reasoning event ──

  it("should encode reasoning events as 'e:reasoning:{json}\\n'", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "reasoning", content: "思考中" });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe(
      `e:reasoning:${JSON.stringify({ content: "思考中" })}\ne:finish\n`
    );
  });

  it("should handle reasoning with special characters", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "reasoning", content: '思考"引号"内容' });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toContain("思考\\u0022引号\\u0022内容");
  });

  // ── tool-call event ──

  it("should encode tool-call events as 'e:tool-call:{json}\\n'", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({
      type: "tool-call",
      toolName: "search_hospital",
      args: { keyword: "协和" },
    });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe(
      `e:tool-call:${JSON.stringify({
        toolName: "search_hospital",
        args: { keyword: "协和" },
      })}\ne:finish\n`
    );
  });

  // ── tool-result event ──

  it("should encode tool-result events as 'e:tool-result:{json}\\n'", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({
      type: "tool-result",
      toolName: "search_hospital",
      result: "找到 3 家医院",
    });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe(
      `e:tool-result:${JSON.stringify({
        toolName: "search_hospital",
        result: "找到 3 家医院",
      })}\ne:finish\n`
    );
  });

  // ── done event ──

  it("should encode done events as 'e:finish\\n'", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe("e:finish\n");
  });

  // ── error event ──

  it("should encode error events as 'e:error:{json}\\n'", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "error", message: "API 失败" });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe(
      `e:error:${JSON.stringify({ message: "API 失败" })}\ne:finish\n`
    );
  });

  // ── order of events ──

  it("should preserve the order of pushed events", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "text", content: "A" });
    pushEvent({ type: "reasoning", content: "B" });
    pushEvent({ type: "tool-call", toolName: "t", args: {} });
    pushEvent({ type: "tool-result", toolName: "t", result: "ok" });
    pushEvent({ type: "error", message: "err" });
    pushEvent({ type: "done" });

    const chunks = await readAllChunks(stream);
    const output = chunks.join("");
    expect(output).toContain(`0:${JSON.stringify("A")}`);
    expect(output).toContain(`e:reasoning:${JSON.stringify({ content: "B" })}`);
    expect(output).toContain("e:tool-call:");
    expect(output).toContain("e:tool-result:");
    expect(output).toContain("e:error:");
    expect(output).toContain("e:finish");
  });

  // ── after cancel ──

  it("should not enqueue events after stream is cancelled", async () => {
    const { stream, pushEvent } = createSSEStream();
    const reader = stream.getReader();
    await reader.cancel();

    // These should be silently dropped (no throw)
    pushEvent({ type: "text", content: "should not appear" });
    pushEvent({ type: "done" });

    // Verify the stream was cancelled — reading should return done immediately
    const { done } = await reader.read();
    expect(done).toBe(true);
  });

  it("should not throw on push after cancel", () => {
    const { stream, pushEvent } = createSSEStream();
    const reader = stream.getReader();
    reader.cancel();

    // All these should not throw
    expect(() => {
      pushEvent({ type: "text", content: "a" });
      pushEvent({ type: "reasoning", content: "b" });
      pushEvent({ type: "tool-call", toolName: "t", args: {} });
      pushEvent({ type: "tool-result", toolName: "t", result: "r" });
      pushEvent({ type: "done" });
      pushEvent({ type: "error", message: "e" });
    }).not.toThrow();
  });

  // ── after done ──

  it("should not enqueue events after done is pushed", async () => {
    const { stream, pushEvent } = createSSEStream();
    pushEvent({ type: "done" });

    // These should be silently dropped
    pushEvent({ type: "text", content: "should not appear" });
    pushEvent({ type: "error", message: "should not appear" });

    const chunks = await readAllChunks(stream);
    expect(chunks.join("")).toBe("e:finish\n");
  });

  // ── all event types combined ──

  it("should correctly encode all event types", async () => {
    const { stream, pushEvent } = createSSEStream();

    const events: AgentEvent[] = [
      { type: "reasoning", content: "思考" },
      { type: "text", content: "回答" },
      { type: "tool-call", toolName: "get_weather", args: { city: "北京" } },
      { type: "tool-result", toolName: "get_weather", result: "晴天" },
      { type: "text", content: "结束" },
      { type: "error", message: "错误" },
      { type: "done" },
    ];

    for (const event of events) {
      pushEvent(event);
    }

    const chunks = await readAllChunks(stream);
    const output = chunks.join("");

    expect(output).toContain(`e:reasoning:${JSON.stringify({ content: "思考" })}`);
    expect(output).toContain(`0:${JSON.stringify("回答")}`);
    expect(output).toContain(`0:${JSON.stringify("结束")}`);
    expect(output).toContain(
      `e:tool-call:${JSON.stringify({
        toolName: "get_weather",
        args: { city: "北京" },
      })}`
    );
    expect(output).toContain(
      `e:tool-result:${JSON.stringify({
        toolName: "get_weather",
        result: "晴天",
      })}`
    );
    expect(output).toContain(`e:error:${JSON.stringify({ message: "错误" })}`);
    expect(output).toContain("e:finish\n");
  });
});
