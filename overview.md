# AI 挂号助手 — 交付总结

## TL;DR
为医院挂号系统增加了 AI 对话式挂号助手，用户只需通过自然语言聊天即可完成查找医院、选择科室、查看排班、管理就诊人、创建挂号的**全流程**。

## 交付概览

| 项目     | 状态                                 |
| -------- | ------------------------------------ |
| 编译     | ✅ 通过                               |
| API 接口 | ✅ `/api/chat` 已注册                 |
| 错误处理 | ✅ 空消息、格式错误、网络异常均已处理 |
| 认证集成 | ✅ 自动识别已登录用户                 |
| 降级机制 | ✅ 未配置 API Key 时显示友好引导      |
| 暗色模式 | ✅ 全面支持                           |

## 架构图

```
用户消息 → ChatPanel(UI) → POST /api/chat → Agent(LLM+Tools)
                                                    │
                          ┌──────────────────────────┼────────────────────────┐
                          │  工具层 (Function Calling)                    │
                    ┌─────┴──────┐  ┌──────┴───────┐  ┌──────┴───────┐
                    │ 搜索类工具  │  │ 就诊人管理工具│  │ 挂号类工具    │
                    │ search_*   │  │ get/create   │  │ create/cancel│
                    └────────────┘  └──────────────┘  └──────────────┘
                          │               │                  │
                          └───────────────┼──────────────────┘
                                          ▼
                                  Prisma Services → SQLite
```

## 文件清单

**新增 (9 个文件)：**
| 文件                                  | 说明                |
| ------------------------------------- | ------------------- |
| `src/lib/ai/types.ts`                 | 类型定义            |
| `src/lib/ai/tools.ts`                 | 11 个工具定义       |
| `src/lib/ai/provider.ts`              | DeepSeek LLM 提供商 |
| `src/lib/ai/agent.ts`                 | Agent 核心逻辑      |
| `src/components/chat/ChatMessage.tsx` | 消息气泡            |
| `src/components/chat/ChatPanel.tsx`   | 聊天面板            |
| `src/components/chat/ChatBubble.tsx`  | 浮动按钮            |
| `src/components/chat/index.ts`        | 导出                |
| `src/app/api/chat/route.ts`           | API 路由            |

**修改 (3 个文件)：**
| 文件                  | 变更            |
| --------------------- | --------------- |
| `src/app/layout.tsx`  | 集成 ChatBubble |
| `src/app/globals.css` | 添加动画        |
| `.env.example`        | 添加 AI 配置    |

## 用户下一步建议

1. **配置 API Key**：在 `.env` 中添加 `AI_API_KEY="your-deepseek-api-key"` 即可启用真正的 AI 对话能力
2. **可选调整模型**：如需切换其他模型，修改 `AI_BASE_URL` 和 `AI_MODEL`
3. **启动开发**：`bun run dev` 即可访问，右下角可见 AI 助手悬浮按钮
4. **测试对话**：点击按钮后可直接输入 "我想挂号" 进行测试
