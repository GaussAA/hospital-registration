import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../api-handler";
import { AppError } from "../errors";
import { fail } from "../response";

const mockRequireAuth = vi.fn();
const mockRequireAdmin = vi.fn();

vi.mock("@/features/auth", () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...args),
}));

vi.mock("../response", () => ({
  success: vi.fn((data: unknown) => ({ code: 0, data, message: "success" })),
  fail: vi.fn((code: number, message: string) => ({ code, data: null, message })),
}));

function createRequest(method = "GET", path = "/api/test"): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`), { method });
}

describe("apiHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue({ user: { id: "user-1", role: "user" } });
    mockRequireAdmin.mockReturnValue({ user: { id: "admin-1", role: "admin" } });
  });

  it("should execute handler successfully without auth", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ message: "ok" }));
    const wrapped = apiHandler(handler);
    const req = createRequest();
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("should call requireAuth when requireAuth config is set", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ message: "ok" }));
    const wrapped = apiHandler(handler, { requireAuth: true });
    const req = createRequest();
    await wrapped(req, { params: Promise.resolve({}) });
    expect(mockRequireAuth).toHaveBeenCalledWith(req);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("should call requireAdmin when requireAdmin config is set", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ message: "ok" }));
    const wrapped = apiHandler(handler, { requireAdmin: true });
    const req = createRequest();
    await wrapped(req, { params: Promise.resolve({}) });
    expect(mockRequireAdmin).toHaveBeenCalledWith(req);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("should return auth error when requireAuth fails", async () => {
    mockRequireAuth.mockReturnValue({ error: NextResponse.json({ code: 40100, message: "未登录" }, { status: 401 }) });
    const handler = vi.fn();
    const wrapped = apiHandler(handler, { requireAuth: true });
    const req = createRequest();
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe(40100);
    expect(handler).not.toHaveBeenCalled();
  });

  it("should resolve params promise before passing to handler", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ message: "ok" }));
    const wrapped = apiHandler(handler);
    const req = createRequest();
    await wrapped(req, { params: Promise.resolve({ id: "123" }) });
    expect(handler).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ params: { id: "123" } }),
    );
  });

  it("should handle AppError and return structured error response", async () => {
    const handler = vi.fn().mockRejectedValue(new AppError("资源不存在", "NOT_FOUND", 404));
    const wrapped = apiHandler(handler);
    const req = createRequest();
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(404);
    expect(fail).toHaveBeenCalledWith(40400, "资源不存在");
  });

  it("should handle 400 AppError", async () => {
    const handler = vi.fn().mockRejectedValue(new AppError("参数错误", "VALIDATION_ERROR", 400));
    const wrapped = apiHandler(handler);
    const req = createRequest();
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    expect(fail).toHaveBeenCalledWith(40001, "参数错误");
  });

  it("should handle 429 AppError", async () => {
    const handler = vi.fn().mockRejectedValue(new AppError("请求太频繁", "RATE_LIMITED", 429));
    const wrapped = apiHandler(handler);
    const req = createRequest();
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(429);
    expect(fail).toHaveBeenCalledWith(42900, "请求太频繁");
  });

  it("should handle Prisma P2002 unique constraint violation", async () => {
    const prismaError = { code: "P2002", message: "Unique constraint failed" };
    const handler = vi.fn().mockRejectedValue(prismaError);
    const wrapped = apiHandler(handler);
    const req = createRequest();
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(409);
    expect(fail).toHaveBeenCalledWith(40900, "该记录已存在");
  });

  it("should handle unexpected errors with 500", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Something went wrong"));
    const wrapped = apiHandler(handler);
    const req = createRequest();
    const res = await wrapped(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(500);
    expect(fail).toHaveBeenCalledWith(50000, "服务器内部错误");
  });

  it("should pass user object to handler when authenticated", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ message: "ok" }));
    const wrapped = apiHandler(handler, { requireAuth: true });
    const req = createRequest();
    await wrapped(req, { params: Promise.resolve({}) });
    expect(handler).toHaveBeenCalledWith(
      req,
      expect.objectContaining({ user: { id: "user-1", role: "user" } }),
    );
  });
});
