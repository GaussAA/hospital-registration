/**
 * vitest 全局 setup
 * 模拟 Next.js 服务端专属模块，使其在测试环境中可导入
 */
import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

vi.mock("server-only", () => ({}));
