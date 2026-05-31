"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { StreamMessage } from "@/lib/ai/types";

const SESSION_KEY = "hospital-chat-session-id";
const CONV_KEY = "hospital-chat-last-conv-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface UseChatStreamOptions {
  initialMessages?: StreamMessage[];
  initialConversationId?: string;
}

interface UseChatStreamReturn {
  messages: StreamMessage[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clearConversation: () => void;
}

/**
 * Custom Hook for SSE-based chat streaming.
 * Connects to /api/chat/stream and manages message state with typing indicators.
 */
export function useChatStream(opts?: UseChatStreamOptions): UseChatStreamReturn {
  const [messages, setMessages] = useState<StreamMessage[]>(
    opts?.initialMessages || []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    opts?.initialConversationId || null
  );
  const abortRef = useRef<AbortController | null>(null);
  const msgIdCounter = useRef(0);
  const restoredRef = useRef(false); // Prevent double-restore in StrictMode

  const genId = () => `msg_${++msgIdCounter.current}`;

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem(CONV_KEY);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message
      const userMsg: StreamMessage = {
        id: genId(),
        role: "user",
        content: content.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Create placeholder assistant message
      const assistantId = genId();
      const assistantMsg: StreamMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        isTyping: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        abortRef.current = new AbortController();
        const sessionId = getSessionId();

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            message: content.trim(),
            conversationId: conversationId || undefined,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Get conversationId from response headers
        const newConvId =
          response.headers.get("x-conversation-id") || conversationId;
        if (newConvId) {
          setConversationId(newConvId);
          localStorage.setItem(CONV_KEY, newConvId);
        }

        // Read SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("0:")) {
              // Text chunk
              const text = line.slice(2);
              try {
                // In ai SDK format, the text after "0:" is JSON-encoded
                const decoded = JSON.parse(text);
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (
                    last &&
                    last.role === "assistant" &&
                    last.id === assistantId
                  ) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + decoded,
                      isTyping: true,
                    };
                  }
                  return updated;
                });
              } catch {
                // Not JSON, treat as plain text
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (
                    last &&
                    last.role === "assistant" &&
                    last.id === assistantId
                  ) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + text,
                      isTyping: true,
                    };
                  }
                  return updated;
                });
              }
            } else if (line.startsWith("e:finish")) {
              // Finish event — end typing
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === assistantId) {
                  updated[updated.length - 1] = {
                    ...last,
                    isTyping: false,
                  };
                }
                return updated;
              });
            } else if (line.startsWith("e:error")) {
              // Error event
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === assistantId) {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content || "请求出错",
                    isTyping: false,
                    isExecutingTool: false,
                  };
                }
                return updated;
              });
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.id === assistantId) {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + "\n\n[已停止]",
                isTyping: false,
              };
            }
            return updated;
          });
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.id === assistantId) {
              updated[updated.length - 1] = {
                ...last,
                content: `网络错误：${err.message}`,
                isTyping: false,
              };
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, conversationId]
  );

  // Restore conversation on mount (guarded against StrictMode double-mount)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (!opts?.initialMessages && !opts?.initialConversationId) {
      const savedConvId = localStorage.getItem(CONV_KEY);
      if (savedConvId) {
        fetch(`/api/conversations/${savedConvId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.code === 0 && data.data) {
              const history: StreamMessage[] = (
                data.data.messages || []
              ).map((m: any) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content || "",
                isTyping: false,
              }));
              setMessages(history);
              setConversationId(savedConvId);
            } else {
              // Conversation not found, clean up
              localStorage.removeItem(CONV_KEY);
            }
          })
          .catch(() => {
            // Restore failed, clean up
            localStorage.removeItem(CONV_KEY);
          });
      }
    }
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    conversationId,
    sendMessage,
    stop,
    clearConversation,
  };
}
