/**
 * 中间件测试 — requireAuth / requireAdmin
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { mockVerifyToken } = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
}));

vi.mock("@/shared/utils/jwt", () => ({
  verifyToken: mockVerifyToken,
}));

import { requireAuth, requireAdmin } from "@/features/auth/middleware";

function createRequest(cookieValue?: string): NextRequest {
  const url = "http://localhost:3000/api/test";
  const headers = new Headers();
  if (cookieValue) {
    headers.set("cookie", `token=${cookieValue}`);
  }
  return new NextRequest(url, { headers });
}

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user when valid token is provided", () => {
    const mockUser = { userId: "user-1", role: "patient" as const };
    mockVerifyToken.mockReturnValue(mockUser);

    const req = createRequest("valid-token");
    const result = requireAuth(req);

    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeUndefined();
    expect(mockVerifyToken).toHaveBeenCalledWith("valid-token");
  });

  it("should return 401 error when no token is provided", () => {
    const req = createRequest();
    const result = requireAuth(req);

    expect(result.user).toBeUndefined();
    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.error!.status).toBe(401);
  });

  it("should return 401 error when token is invalid", () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const req = createRequest("invalid-token");
    const result = requireAuth(req);

    expect(result.user).toBeUndefined();
    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.error!.status).toBe(401);
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user when admin token is provided", () => {
    const mockUser = { userId: "admin-1", role: "admin" as const };
    mockVerifyToken.mockReturnValue(mockUser);

    const req = createRequest("admin-token");
    const result = requireAdmin(req);

    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeUndefined();
  });

  it("should return 403 error when user is not admin", () => {
    const mockUser = { userId: "user-1", role: "patient" as const };
    mockVerifyToken.mockReturnValue(mockUser);

    const req = createRequest("patient-token");
    const result = requireAdmin(req);

    expect(result.user).toBeUndefined();
    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.error!.status).toBe(403);
  });

  it("should return 401 error when no token is provided", () => {
    const req = createRequest();
    const result = requireAdmin(req);

    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.error!.status).toBe(401);
  });
});
