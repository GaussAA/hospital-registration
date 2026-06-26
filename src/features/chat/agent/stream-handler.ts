/**
 * Stream Handler — SSE (Server-Sent Events) serialization layer.
 *
 * Creates a ReadableStream that pushes SSE events in real-time via a callback,
 * enabling true streaming rather than collecting all events first.
 *
 * Serialization format (compatible with useChatStream.ts):
 *   0:{text}\n              → 文本
 *   e:reasoning:{json}\n    → 思考
 *   e:tool-call:{json}\n    → 工具开始
 *   e:tool-result:{json}\n  → 工具结果
 *   e:finish\n              → 结束
 *   e:error:{json}\n        → 错误
 *
 * Note: The `d:{json}\n\n` metadata event is appended by the route layer,
 * not by this module.
 */

import type { AgentEvent } from "./agent-runner";

/**
 * Create a streaming SSE response and return the stream along with a push
 * function that can be used as the onEvent callback for runAgentLoop.
 *
 * Usage:
 *   const { stream, pushEvent } = createSSEStream();
 *   await runAgentLoop(messages, tools, context, pushEvent);
 *   pushEvent({ type: "done" }); // or it will be emitted by runAgentLoop
 *   return new Response(stream, ...);
 */
export function createSSEStream(): {
  stream: ReadableStream<Uint8Array>;
  pushEvent: (event: AgentEvent) => void;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let finished = false;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      finished = true;
    },
  });

  const pushEvent = (event: AgentEvent) => {
    if (finished || !controller) return;

    try {
      switch (event.type) {
        case "text":
          controller.enqueue(encoder.encode(`0:${JSON.stringify(event.content)}\n`));
          break;
        case "reasoning":
          controller.enqueue(
            encoder.encode(`e:reasoning:${JSON.stringify({ content: event.content })}\n`)
          );
          break;
        case "tool-call":
          controller.enqueue(
            encoder.encode(
              `e:tool-call:${JSON.stringify({ toolName: event.toolName, args: event.args })}\n`
            )
          );
          break;
        case "tool-result":
          controller.enqueue(
            encoder.encode(
              `e:tool-result:${JSON.stringify({ toolName: event.toolName, result: event.result })}\n`
            )
          );
          break;
        case "done":
          controller.enqueue(encoder.encode("e:finish\n"));
          controller.close();
          finished = true;
          break;
        case "error":
          controller.enqueue(
            encoder.encode(`e:error:${JSON.stringify({ message: event.message })}\n`)
          );
          break;
      }
    } catch {
      // Stream may have been cancelled
      finished = true;
    }
  };

  return { stream, pushEvent };
}
