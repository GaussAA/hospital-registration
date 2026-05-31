# AI 助手修复报告（2026-06-01）

## 问题一：新建会话仅清空界面

### 根因
`newConversation()` 只清空了前端的 `messages` 和 `conversationId`（置 null），但并未在服务端创建新对话。下次发消息时，流式路由调用 `ConversationStore.getOrCreate()`，按 `sessionId` 找到最新的旧对话直接复用。

### 修复方案
1. **新增 `POST /api/conversations` 路由** — 在服务端显式创建新对话并返回 ID
2. **`newConversation()` 改为 async** — 调 POST 获取新 ID，设置 `conversationId` 和 `convIdRef`
3. **流式路由创建策略变更** — 无 `conversationId` 时用 `create()` 而非 `getOrCreate()`
4. **新增 `convIdRef`** — 解决 React 闭包陈旧性问题，确保 `sendMessage` 始终读取最新 ID

## 问题二：工具调用无法获取实时数据 / 无法完成挂号

### 根因
1. **历史消息加载丢弃工具调用上下文** — 流式路由加载历史时只取了 `role` + `content`，`toolCalls` 字段（含 `tool_calls` 和 `tool_call_id`）被完全丢弃
2. **工具消息未持久化** — 只有助理的文本内容被存储，工具调用链从未写入 DB
3. **切换/恢复对话后 LLM 无上下文** — DeepSeek API 收到残缺消息，无法理解之前的工具调用

### 修复方案
1. **扩展 `ChatMessage` 类型** — 加入 `tool_calls` / `tool_call_id` 字段
2. **新增 `loadHistoryAsChatMessages()`** — 从 DB 的 `toolCalls` JSON 字段恢复完整的 tool_calls 数组和 tool_call_id
3. **`e:tool-messages` SSE 事件** — agent loop 完成后发射完整工具调用链
4. **消息持久化增强** — 流式路由捕获该事件，将工具消息批量写入 DB

## 涉及文件（7 个）

| 文件 | 改动 |
|------|------|
| `src/lib/ai/types.ts` | 扩展 ChatMessage（tool_calls, tool_call_id）+ SSEEventType |
| `src/lib/ai/stream-agent.ts` | 工具消息持久化事件 + 类型安全 |
| `src/lib/ai/conversation-store.ts` | 新增 loadHistoryAsChatMessages |
| `src/app/api/conversations/route.ts` | 新增 POST 方法 |
| `src/app/api/chat/stream/route.ts` | 重写历史加载 + 工具持久化逻辑 |
| `src/app/api/chat/route.ts` | 修复类型 |
| `src/hooks/useChatStream.ts` | 修复 newConversation + convIdRef |
