# 🏥 健康挂号 — 全方位优化方案

> 本文档基于对项目 97 个源文件的全面诊断，按优先级（P0/P1/P2）梳理优化方向与具体执行方案。

---

## 一、安全加固（P0 — 立即执行）

### 1.1 JWT 密钥硬编码风险

**问题**：`src/lib/utils/jwt.ts` 第 3-4 行存在硬编码 fallback 密钥

```typescript
const JWT_SECRET =
  process.env.JWT_SECRET ?? "hospital-registration-jwt-secret-dev";
```

**风险**：任何人知道此密钥即可伪造任意用户的 Token，获取管理权限。

**执行方案**：
1. 移除 fallback 值，改为运行时强制检查
2. 确保 `.env` 文件已加入 `.gitignore`
3. 本地开发通过 `.env.local` 注入密钥

```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET 环境变量未设置");
}
```

---

### 1.2 `user_info` Cookie 泄露用户数据

**问题**：登录时设置了 `httpOnly: false` 的 `user_info` cookie，明文存储 `name` 和 `role`

**风险**：XSS 攻击可读取该 cookie，获取用户角色信息辅助攻击。

**执行方案**：
1. 移除 `user_info` cookie 的写入
2. 前端改为在登录/注册 API 响应中返回用户信息，存入内存（React Context）
3. 页面刷新时通过 `/api/auth/me` 端点获取用户信息

---

### 1.3 删除确认使用浏览器 `confirm()`

**问题**：`DataTable.tsx` 及所有管理页面的删除操作使用原生 `confirm()`，Chrome 已逐步弃用

**风险**：用户体验差，且在某些浏览器上不生效或在无头测试中阻断流程。

**执行方案**：
1. 创建 `ConfirmDialog` 组件（模态框 + 遮罩层 + 键盘支持）
2. 替换所有 `confirm()` 调用

---

### 1.4 缺少 CSRF 防护

**问题**：所有 API 路由仅依赖 Cookie 认证，无 CSRF Token

**执行方案**：
1. 使用 `SameSite=Lax` Cookie 属性（已有默认值可满足基本防护）
2. 对关键操作（注销、取消挂号等）追加确认机制

---

### 1.5 缺少认证限流

**问题**：`/api/auth/login` 和 `/api/auth/register` 无频率限制

**风险**：可被暴力破解或批量注册。

**执行方案**：
1. 使用内存 Map 实现简易 IP 频率限制（middleware 层）
2. 或集成第三方限流库

---

## 二、架构与设计模式（P1 — 重要改进）

### 2.1 API 路由统一错误处理

**问题**：每个 API 路由文件重复编写 try-catch 和错误映射

**现状**：每个 route 平均 20+ 行样板错误处理代码，19 个 API 路由文件都存在此冗余。

**执行方案**：创建统一错误处理包装函数

```typescript
// src/lib/utils/api-handler.ts
import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { fail } from "./response";
import { verifyToken } from "./jwt";
import type { JwtPayload } from "./jwt";

type Handler<T = unknown> = (req: NextRequest, params: T) => Promise<NextResponse>;

interface RouteConfig {
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export function apiHandler<T>(
  handler: Handler<T>,
  config?: RouteConfig,
) {
  return async (req: NextRequest, { params }: { params: T }) => {
    try {
      if (config?.requireAuth || config?.requireAdmin) {
        const token = req.cookies.get("token")?.value;
        if (!token) {
          return NextResponse.json(fail(40100, "未认证"), { status: 401 });
        }
        const payload = verifyToken(token);
        if (config?.requireAdmin && payload.role !== "admin") {
          return NextResponse.json(fail(40101, "权限不足"), { status: 403 });
        }
        // 将 payload 附加到请求上供 handler 使用
        (req as unknown as Record<string, unknown>).user = payload;
      }
      return await handler(req, params);
    } catch (error) {
      if (error instanceof AppError) {
        const codeMap: Record<number, number> = { 400: 40001, 401: 40100, 403: 40101, 404: 40400, 409: 40900 };
        return NextResponse.json(
          fail(codeMap[error.statusCode] || 50000, error.message),
          { status: error.statusCode },
        );
      }
      console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error);
      return NextResponse.json(fail(50000, "服务器内部错误"), { status: 500 });
    }
  };
}
```

**效果**：消除约 80% 的样板代码，统一错误码和日志格式。

---

### 2.2 管理页面 CRUD 重复模式提取

**问题**：4 个管理页面（hospitals/departments/doctors/schedules）重复相同的 fetch/create/edit/delete 模式。

**执行方案**：创建 `useAdminCrud` Hook

```typescript
// src/lib/hooks/useAdminCrud.ts
export function useAdminCrud<T extends { id: string }>({
  baseUrl,
  pageSize = 10,
}: {
  baseUrl: string;
  pageSize?: number;
}) {
  // 封装 list/create/update/delete 逻辑
  // 返回 { data, loading, page, total, setPage, createRecord, updateRecord, deleteRecord }
}
```

**效果**：每个管理页面的代码量减少 60%+，统一数据加载和错误处理。

---

### 2.3 Zod 校验覆盖 Query 参数

**问题**：GET 路由的查询参数仅手动 `parseInt` + 默认值处理，无校验。

**执行方案**：为每个 GET 接口的查询参数创建 Zod schema

```typescript
const hospitalListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  city: z.string().optional(),
  level: z.string().optional(),
  keyword: z.string().optional(),
});
```

---

### 2.4 新增逻辑隔离层

**问题**：`auth.service.ts` 中注册/登录手动检查字段，未使用 Zod schema。

**执行方案**：
1. `src/lib/validations/auth.schema.ts` 已定义 Zod schema
2. 在 service 层内部调用 zod 校验，而非手动 `if (!name || ...)`

---

## 三、性能优化（P1 — 重要）

### 3.1 Prisma 查询 N+1 风险

**问题**：`listRegistrations` 使用的 `include` 嵌套多层关系，但 Prisma 7.x 使用 SQLite 时有潜在性能问题。

**执行方案**：
1. 为高频查询添加 `@@index` 复合索引（已有基础，检查是否需要更多）
2. 对大数据量查询使用 `select` 替代 `include`，仅获取必要字段
3. 考虑为医院/医生详情页面添加 React `cache()` 缓存

### 3.2 图片资源优化

**问题**：医院和医生的 `imageUrl` / `avatarUrl` 直接使用外部 URL，未使用 Next/Image。

**执行方案**：
1. 使用 `next/image` 组件，配置 `remotePatterns`
2. 对本地无图片的资源使用占位 SVG 或渐变背景

### 3.3 添加 Suspense 边界

**问题**：公共页面使用 `force-dynamic` 且无流式加载策略。

**执行方案**：
1. 为医院详情/医生详情页添加 Suspense 包裹异步数据加载部分
2. 骨架屏替代 Spinner

---

## 四、代码质量与类型安全（P1 — 持续改进）

### 4.1 消除 `any` 类型

| 文件                                       | 行号 | 问题                      | 修复方案                                                 |
| ------------------------------------------ | ---- | ------------------------- | -------------------------------------------------------- |
| `src/components/admin/DataTable.tsx`       | 26   | `Record<string, any>`     | 使用 `Record<string, ColumnValue>`，`ColumnValue` 已定义 |
| `src/lib/services/registration.service.ts` | 88   | `Record<string, unknown>` | 使用 Prisma 生成的 `Prisma.RegistrationWhereInput`       |
| `src/components/auth/LoginForm.tsx`        | —    | 多处 `as` 类型断言        | 使用 Zod 推断类型替代手动断言                            |

### 4.2 消除 Magic Number 和字符串

```typescript
// 改为常量
const TOAST_DURATION_MS = 3500;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const SESSION_EXPIRY_DAYS = 7;
```

### 4.3 状态枚举类型化

**问题**：`role`、`status`、`timeSlot`、`type` 等字段使用 `string` 类型，Prisma schema 也未使用 enum。

**执行方案**：
1. Prisma schema 使用 enum 替代 string（SQLite 支持 enum 作为约束）
2. 前端组件直接引用 Prisma 生成的枚举类型

---

## 五、测试基建（P2 — 重要但可后置）

### 5.1 单元测试框架搭建

```typescript
// 推荐：Vitest（与 bun 兼容性好）
// pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

**优先级**：
1. Service 层测试（无状态，纯逻辑）
2. API handler 测试（模拟 NextRequest / NextResponse）
3. 组件测试（关键交互路径）

### 5.2 核心业务测试用例

| 测试场景                       | 类型     | 优先级 |
| ------------------------------ | -------- | ------ |
| 挂号乐观锁（并发争抢同一号源） | 集成测试 | P0     |
| 取消挂号后号源释放             | 集成测试 | P1     |
| 同一天同一时段重复挂号被拒绝   | 集成测试 | P1     |
| 非本人无法查看他人挂号         | 集成测试 | P1     |
| Admin API 权限校验             | 单元测试 | P1     |

### 5.3 E2E 测试（Playwright）

- 用户注册 → 选择医院 → 选择科室 → 选择医生 → 选择号源 → 确认挂号 → 查看挂号记录
- Admin CRUD 流程

---

## 六、CI/CD 与工程化（P2）

### 6.1 GitHub Actions 工作流

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run lint
      - run: bun run build
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bun install
      - run: bun run test
```

### 6.2 ESLint 配置增强

- 启用 `@typescript-eslint/no-explicit-any` 为 error
- 添加 `no-console` 警告（引导使用结构化日志）
- 添加 `prefer-const` 等规范规则

---

## 七、用户体验改进（P2 — 迭代优化）

### 7.1 关键交互改进

| 改进项       | 说明                                  | 优先级 |
| ------------ | ------------------------------------- | ------ |
| 骨架屏       | 替代 Spinner，加载时显示内容骨架      | P1     |
| 表单自动保存 | 防止填写过程中页面意外刷新丢失数据    | P2     |
| Modal 增强   | 添加 ESC 关闭、点击遮罩关闭、焦点陷阱 | P1     |
| Toast 栈优化 | 添加关闭按钮、可点击跳转              | P2     |
| 键盘导航     | 日历表格支持键盘方向键选择            | P2     |
| 搜索防抖     | 搜索框 300ms 防抖减少请求             | P1     |
| 删除二次确认 | 自定义确认弹窗替代 `confirm()`        | P1     |

### 7.2 响应式细节

| 页面           | 问题                     | 改进                      |
| -------------- | ------------------------ | ------------------------- |
| 医生详情页日历 | 小屏幕下表格滚动体验一般 | 移动端卡片式已实现 ✅      |
| 管理后台侧边栏 | 移动端需要汉堡菜单       | 已有 `lg:pt-0 pt-14` 处理 |
| 首页           | 可添加微交互动画         | 可选优化                  |

---

## 八、执行路线图

```
Phase 1 — 安全加固（1-2 天）
  □ JWT 密钥移除硬编码
  □ user_info cookie 移除
  □ 创建 ConfirmDialog 替换 confirm()
  □ API 限流
  □ CSRF 防护（SameSite）

Phase 2 — 架构优化（2-3 天）
  □ apiHandler 统一错误处理
  □ useAdminCrud Hook
  □ Zod 覆盖 Query 参数校验
  □ API 路由路径规范化

Phase 3 — 性能与类型安全（2-3 天）
  □ Prisma 查询优化 + 索引审查
  □ 消除 any 类型
  □ 常量提取
  □ 枚举类型化
  □ Suspense + 骨架屏

Phase 4 — 测试基建（3-4 天）
  □ Vitest 框架搭建
  □ Service 层测试
  □ API 测试 + 乐观锁测试
  □ CI 工作流

Phase 5 — UX 打磨（持续）
  □ Modal 增强
  □ 搜索防抖
  □ 键盘导航
  □ 微交互动画
```

---

## 九、总结：项目健康评分

| 维度     | 当前评分 | 目标评分 | 关键短板                    |
| -------- | -------- | -------- | --------------------------- |
| 安全     | ★★★☆☆    | ★★★★★    | JWT 密钥、CSRF、限流        |
| 架构     | ★★★★☆    | ★★★★★    | 错误处理重复、CRUD 模式重复 |
| 性能     | ★★★☆☆    | ★★★★☆    | Prisma 查询优化、图片优化   |
| 类型安全 | ★★★★☆    | ★★★★★    | 少量 any 和断言             |
| 测试     | ★☆☆☆☆    | ★★★★☆    | 零测试覆盖                  |
| 用户体验 | ★★★☆☆    | ★★★★☆    | 加载态、键盘导航、反馈      |
| 工程化   | ★★☆☆☆    | ★★★★☆    | CI/CD、Lint 规则、文档      |

> **整体评价**：项目基础架构清晰，技术栈选型合理（Next.js 16 + Prisma 7 + Zod 4）。核心业务逻辑（乐观锁）实现正确。当前最大短板是 **零测试覆盖** 和 **安全细节的疏忽**。建议按 Phase 1 → Phase 2 的优先级逐步推进，Phase 3/4 可并行进行。

> 臣已备好执行方案，大帅若允，臣这便从 Phase 1 开始动手。
