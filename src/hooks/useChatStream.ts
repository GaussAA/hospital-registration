"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { StreamMessage, ConversationSummary } from "@/lib/ai/types";

/* ── Internal types ── */

interface ApiMessage {
  id: string;
  role: string;
  content: string;
}

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
  /** Optional userId from auth context, used as fallback when cookie fails */
  userId?: string;
}

interface UseChatStreamReturn {
  messages: StreamMessage[];
  input: string;
  setInput: (val: string) => void;
  isLoading: boolean;
  conversationId: string | null;
  conversations: ConversationSummary[];
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  clearConversation: () => void;
  newConversation: () => Promise<void>;
  switchConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
}

/**
 * Custom Hook for SSE-based chat streaming.
 * Connects to /api/chat/stream and manages messages with typing indicators,
 * tool call visualization, and conversation management.
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
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const msgIdCounter = useRef(0);
  const restoredRef = useRef(false);
  // Use a ref for conversationId so sendMessage always reads the latest value
  const convIdRef = useRef<string | null>(conversationId);
  // Use a ref for userId so sendMessage always has the latest auth state
  // (UserProvider loads async, so opts?.userId starts as null then updates)
  const userIdRef = useRef<string | undefined>(opts?.userId);

  // Sync conversationId ref with state
  useEffect(() => {
    convIdRef.current = conversationId;
  }, [conversationId]);

  // Sync userId ref when opts?.userId changes (user logs in/out)
  useEffect(() => {
    userIdRef.current = opts?.userId;
  }, [opts?.userId]);

  const genId = () => `msg_${++msgIdCounter.current}`;

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    convIdRef.current = null;
    localStorage.removeItem(CONV_KEY);
  }, []);

  /** Fetch conversation list for the current session */
  const fetchConversations = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/conversations?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.code === 0 && Array.isArray(data.data)) {
        setConversations(data.data);
      }
    } catch {
      // Silently fail — not critical
    }
  }, []);

  /** Create a new conversation — actually creates one on the server */
  const newConversation = useCallback(async () => {
    stop();
    setMessages([]);
    setConversationId(null);
    convIdRef.current = null;
    localStorage.removeItem(CONV_KEY);

    try {
      const sessionId = getSessionId();
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": sessionId },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data?.id) {
        const newId = data.data.id;
        setConversationId(newId);
        convIdRef.current = newId;
        localStorage.setItem(CONV_KEY, newId);
      }
    } catch {
      // Server-side creation failed; next message will still create a new one
    }

    fetchConversations();
  }, [stop, fetchConversations]);

  /** Switch to an existing conversation */
  const switchConversation = useCallback(async (id: string) => {
    stop();
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      if (data.code === 0 && data.data) {
        const history: StreamMessage[] = (data.data.messages || []).map((m: ApiMessage) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content || "",
          isTyping: false,
        }));
        setMessages(history);
        setConversationId(id);
        convIdRef.current = id;
        localStorage.setItem(CONV_KEY, id);
      }
    } catch {
      // Failed to switch
    }
  }, [stop]);

  /** Delete a conversation */
  const deleteConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.code === 0) {
        // If the deleted conversation was active, clear it
        if (conversationId === id) {
          clearConversation();
        }
        fetchConversations();
      }
    } catch {
      // Failed to delete
    }
  }, [conversationId, clearConversation, fetchConversations]);

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
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            message: content.trim(),
            conversationId: convIdRef.current || undefined,
            userId: userIdRef.current,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Get conversationId from response headers
        const newConvId =
          response.headers.get("x-conversation-id") || convIdRef.current;
        if (newConvId) {
          setConversationId(newConvId);
          convIdRef.current = newConvId;
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
                const decoded = JSON.parse(text);
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant" && last.id === assistantId) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + decoded,
                      isTyping: true,
                    };
                  }
                  return updated;
                });
              } catch {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant" && last.id === assistantId) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + text,
                      isTyping: true,
                    };
                  }
                  return updated;
                });
              }
            } else if (line.startsWith("e:tool-call")) {
              // Tool call started — show executing state
              try {
                const dataPart = line.replace("e:tool-call\nd:", "").trim();
                const toolData = JSON.parse(dataPart);
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.id === assistantId) {
                    updated[updated.length - 1] = {
                      ...last,
                      isExecutingTool: true,
                      executingToolName: toolData.toolName,
                    };
                  }
                  return updated;
                });
              } catch {}
            } else if (line.startsWith("e:tool-result")) {
              // Tool result received — clear executing state
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === assistantId) {
                  updated[updated.length - 1] = {
                    ...last,
                    isExecutingTool: false,
                    executingToolName: undefined,
                  };
                }
                return updated;
              });
            } else if (line.startsWith("e:finish")) {
              // Finish event
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.id === assistantId) {
                  updated[updated.length - 1] = {
                    ...last,
                    isTyping: false,
                    isExecutingTool: false,
                  };
                }
                return updated;
              });
              // Refresh conversation list
              fetchConversations();
            } else if (line.startsWith("d:")) {
              // Data event — extract assistantMessageId for feedback
              try {
                const dataStr = line.slice(2).trim();
                const data = JSON.parse(dataStr);
                if (data.assistantMessageId) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.id === assistantId) {
                      updated[updated.length - 1] = {
                        ...last,
                        messageId: data.assistantMessageId,
                      };
                    }
                    return updated;
                  });
                }
              } catch {}
            } else if (line.startsWith("e:error")) {
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
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
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
                content: `网络错误：${err instanceof Error ? err.message : String(err)}`,
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
    [isLoading, fetchConversations]
  );

  // Restore conversation on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    // Fetch conversation list
    fetchConversations();

    if (!opts?.initialMessages && !opts?.initialConversationId) {
      const savedConvId = localStorage.getItem(CONV_KEY);
      if (savedConvId) {
        fetch(`/api/conversations/${savedConvId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.code === 0 && data.data) {
              const history: StreamMessage[] = (data.data.messages || []).map((m: ApiMessage) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content || "",
                isTyping: false,
              }));
              setMessages(history);
              setConversationId(savedConvId);
              convIdRef.current = savedConvId;
            } else {
              localStorage.removeItem(CONV_KEY);
            }
          })
          .catch(() => {
            localStorage.removeItem(CONV_KEY);
          });
      }
    }
  }, [fetchConversations, opts?.initialConversationId, opts?.initialMessages]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    conversationId,
    conversations,
    sendMessage,
    stop,
    clearConversation,
    newConversation,
    switchConversation,
    deleteConversation,
    fetchConversations,
  };
}
