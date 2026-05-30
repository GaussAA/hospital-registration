import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/utils/jwt";

/**
 * Next.js 16 proxy / middleware.
 * - /admin/* page routes → require JWT + admin role
 * - /api/admin/*         → require JWT + admin role, return JSON error
 * - /api/appointments/*  → require JWT
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
