import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, requireAdmin } from "@/features/auth/middleware";
import { checkRateLimit, getRateLimitKey } from "@/shared/utils/rate-limit";
import {
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_MS,
} from "@/shared/utils/constants";

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

  // ── Admin page routes ───────────────────────────────────────────────
  if (pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ── Admin API routes ────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    const { error } = requireAdmin(request);
    if (error) return error;
  }

  // ── Appointment API routes ──────────────────────────────────────────
  if (pathname.startsWith("/api/appointments")) {
    const { error } = requireAuth(request);
    if (error) return error;
  }

  return NextResponse.next();
}
