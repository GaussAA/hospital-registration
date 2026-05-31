# AI 挂号助手 — 交付总结

## TL;DR
为「健康挂号」系统完整引入 AI 对话式挂号助手，用户通过自然语言聊天即可完成挂号全流程。采用 Vercel AI SDK + DeepSeek API，对话持久化落库，SSE 流式打字机效果，匿名/登录双模式支持。

---

## 交付概览

| 项目 | 状态 |
|------|------|
| 编译 | ✅ 通过 |
| 数据库迁移 | ✅ Conversation + Message 表已创建 |
| 单元测试 | ✅ **55/55 全部通过** |
| SSE 流式 API | ✅ `POST /api/chat/stream` |
| 对话持久化 | ✅ 跨页面刷新恢复 |
| 悬浮球交互 | ✅ 可点开/关闭/键盘支持 |
| 打字机效果 | ✅ 闪烁光标 `▊` |
| 工具调用状态 | ✅ "正在查询..." |

---

## 架构一览

```
用户 → ChatBubble → ChatPanel → useChatStream Hook
    → POST /api/chat/stream (SSE)
      → stream-agent.ts (ai SDK streamText + tool calling)
        → tools.ts (11 个挂号工具)
        → conversation-store.ts (Prisma 持久化)
          → Conversation + Message 表 (SQLite)
```

## 新增 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/stream` | SSE 流式聊天（主力端点） |
| GET | `/api/conversations` | 对话列表 |
| GET | `/api/conversations/[id]` | 对话详情（含消息） |
| POST | `/api/upload` | 文件上传（P0 存根） |

---

## 文件清单

### 新建 (7 个)
| 文件 | 说明 |
|------|------|
| `src/lib/ai/stream-agent.ts` | 流式 Agent（ai SDK + tool calling） |
| `src/lib/ai/conversation-store.ts` | 对话持久化层（CRUD） |
| `src/hooks/useChatStream.ts` | SSE 消费 Hook（打字机 + 对话恢复） |
| `src/app/api/chat/stream/route.ts` | SSE 流式 API |
| `src/app/api/conversations/route.ts` | 对话列表 API |
| `src/app/api/conversations/[id]/route.ts` | 对话详情 API |
| `src/app/api/upload/route.ts` | 上传存根 API |

### 修改 (6 个)
| 文件 | 变更 |
|------|------|
| `prisma/schema.prisma` | 新增 Conversation + Message 模型 |
| `package.json` | 新增 ai, @ai-sdk/openai, uuid |
| `src/lib/ai/types.ts` | 追加流式/对话类型 |
| `src/components/chat/ChatMessage.tsx` | 打字光标 + 工具状态 |
| `src/components/chat/ChatPanel.tsx` | 接入 useChatStream |
| `src/components/chat/ChatBubble.tsx` | 交互修复 |

### 文档 (2 个)
| 文件 | 说明 |
|------|------|
| `docs/prd-ai-assistant.md` | 产品需求文档 |
| `docs/architecture-ai-assistant.md` | 架构设计文档 |

### 测试 (2 个)
| 文件 | 用例数 |
|------|--------|
| `tests/ai-conversation-store.test.ts` | 18 |
| `tests/ai-stream-route.test.ts` | 10 |

---

## 用户下一步建议

1. **启动开发服务器**：`bun run dev`，右下角可见 🤖 紫色悬浮球
2. **测试 AI 对话**：点击悬浮球 → 输入"我想挂号" → 观察 SSE 打字机效果
3. **检查模型配置**：`.env` 中 `AI_MODEL=deepseek-chat`，如用其他模型可调整
4. **验证跨页面恢复**：发送几条消息后刷新页面，看对话是否还在
5. **后续 P1/P2**：图片上传分析、历史对话列表管理、Markdown 渲染等已在 PRD 中规划
