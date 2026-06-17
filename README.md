# 健康挂号 — 在线预约挂号平台

> TS 6 + Next.js 16 + Prisma 7 + SQLite + Tailwind CSS 4 + Bun

在线医院挂号系统，支持患者端浏览医院/科室/医生、预约号源、AI 对话挂号，以及管理员后台管理。

---

## 快速开始

```bash
# 安装依赖
bun install

# 生成 Prisma client
bun run prisma:generate

# 推送数据库 schema
bun run prisma:push

# 种子数据（创建默认管理员）
bun run prisma:seed

# 启动开发服务器
bun run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 环境变量

```env
# 必填
JWT_SECRET=your-jwt-secret

# AI 助手（可选，不配置则正常使用手动流程）
AI_API_KEY=sk-your-deepseek-api-key
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash

# 数据库（可选，默认 file:./prisma/dev.db）
DATABASE_URL=file:./prisma/dev.db
```

## 命令

| 命令                    | 说明               |
| ----------------------- | ------------------ |
| `bun run dev`           | 启动开发服务器     |
| `bun run build`         | 生产构建           |
| `bun run test`          | 运行测试（Vitest） |
| `bun run test:coverage` | 测试覆盖率         |
| `bun run lint`          | ESLint 检查        |

## 测试

```bash
# 全量测试
bun run test        # 121 个测试

# 仅 Watch
bun run test:watch

# 覆盖率
bun run test:coverage
```

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript 6
- **数据库**: SQLite (LibSQL / Prisma 7)
- **运行时**: Bun
- **样式**: Tailwind CSS 4 + CSS 变量主题
- **验证**: Zod 4
- **AI 助手**: DeepSeek Function Calling

## 项目结构

```
src/
├── app/           # 页面 + API 路由
├── components/    # UI 组件
├── lib/           # 业务逻辑
│   ├── services/  # Service 层
│   ├── ai/        # AI Agent
│   ├── auth/      # 认证
│   └── utils/     # 工具函数
├── types/         # 类型定义
└── hooks/         # React Hooks
```

## 文档

详细文档见 [`docs/`](docs/README.md) 目录：

- [系统架构](docs/architecture/system-design.md)
- [AI 助手架构](docs/architecture/ai-assistant.md)
- [重构技术决策](docs/decisions/2026-05-31-refactoring.md)
- [API 文档](docs/README.md)
