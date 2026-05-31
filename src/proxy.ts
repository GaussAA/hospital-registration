import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";
import { checkRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit";
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

/**
 * Next.js 16 proxy / middleware.
 * - /admin/* page routes → require JWT + admin role
 * - /api/admin/*         → require JWT + admin role, return JSON error
 * - /api/appointments/*  → require JWT
 * - /api/auth/* (POST)   → rate-limited (10 req/min per IP)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting for auth endpoints (prevent brute force) ─────────
  if (
    request.method === "POST" &&
    (pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/auth/register"))
  ) {
    const key = getRateLimitKey(request, "auth");
    if (!checkRateLimit(key, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS)) {
      return NextResponse.json(
        { code: 42900, data: null, message: "请求过于频繁，请稍后再试" },
        { status: 429 },
      );
    }
  }

  const token = request.cookies.get("token")?.value;

  // ── Admin page routes ───────────────────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    try {
      const payload = verifyToken(token);
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ── Admin API routes ────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.json(
        { code: 40100, data: null, message: "未认证" },
        { status: 401 },
      );
    }
    try {
      const payload = verifyToken(token);
      if (payload.role !== "admin") {
        return NextResponse.json(
          { code: 40101, data: null, message: "权限不足" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { code: 40100, data: null, message: "Token 无效" },
        { status: 401 },
      );
    }
  }

  // ── Appointment API routes ──────────────────────────────────────────
  if (pathname.startsWith("/api/appointments")) {
    if (!token) {
      return NextResponse.json(
        { code: 40100, data: null, message: "未认证" },
        { status: 401 },
      );
    }
    try {
      verifyToken(token);
    } catch {
      return NextResponse.json(
        { code: 40100, data: null, message: "Token 无效" },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}
