import type { TimeSlot, ScheduleType } from "@/types/index";

/* ── Chat Message Types ── */

// Tool call structure (OpenAI/DeepSeek compatible)
export interface ToolCallData {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  /** For assistant messages — array of tool calls (OpenAI format) */
  tool_calls?: ToolCallData[];
  /** For tool messages — ID of the tool call this result belongs to */
  tool_call_id?: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

/* ── Agent Tool System ── */

export type ToolParamType = "string" | "number" | "boolean" | "object";

export interface ToolParam {
  type: ToolParamType;
  description: string;
  required?: boolean;
  enum?: string[];
  properties?: Record<string, ToolParam>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ToolParam>;
  /** Execute the tool with given args. Returns a string result. */
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<string>;
}

export interface ToolContext {
  userId?: string;
  userRole?: string;
}

/** OpenAI/DeepSeek-compatible function calling format */
export interface FunctionCallTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

/* ── Conversation State ── */

export interface ConversationState {
  /** Current step in the registration flow, if any */
  step?: "idle" | "selecting_hospital" | "selecting_department" | "selecting_doctor" | "checking_schedule" | "selecting_profile" | "confirming" | "done";
  /** Cached data for multi-turn flows */
  cache: {
    hospitalId?: string;
    hospitalName?: string;
    departmentId?: string;
    departmentName?: string;
    doctorId?: string;
    doctorName?: string;
    scheduleId?: string;
    scheduleDate?: string;
    scheduleTimeSlot?: TimeSlot;
    scheduleType?: ScheduleType;
    profileId?: string;
    profileName?: string;
  };
}

export function createInitialState(): ConversationState {
  return { step: "idle", cache: {} };
}

// ── 流式消息（含 UI 状态） ──
export interface StreamMessage {
  id: string;
  /** 数据库中的消息 ID，用于反馈提交 */
  messageId?: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCallInfo[];
  isTyping?: boolean;
  isExecutingTool?: boolean;
  executingToolName?: string;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: string;
  status: "pending" | "executing" | "done" | "error";
  result?: string;
}

// ── Conversation 类型 ──
export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: string;
    content: string | null;
    toolCalls: string | null;
    createdAt: string;
  }>;
}

// ── SSE 事件（ai SDK 默认格式） ──
export type SSEEventType =
  | { type: "text"; content: string }
  | { type: "tool-call"; toolName: string; args: Record<string, unknown> }
  | { type: "tool-result"; toolName: string; result: string }
  | { type: "tool-messages"; messages: Array<{ role: string; content: string | null; toolCalls?: string; toolCallId?: string }> }
  | { type: "finish"; finishReason: string; conversationId?: string }
  | { type: "error"; message: string };
