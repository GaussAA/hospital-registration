import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { fail } from "./response";
import { requireAuth, requireAdmin } from "@/features/auth/middleware";
import type { JwtPayload } from "./jwt";

/* ── Types ── */

type RouteContext<T = unknown> = { params: T };

type ApiHandler<T = unknown> = (
  req: NextRequest,
  ctx: RouteContext<T> & { user?: JwtPayload },
) => Promise<NextResponse>;

interface RouteConfig {
  /** Require a valid JWT token */
  requireAuth?: boolean;
  /** Require admin role (implies requireAuth) */
  requireAdmin?: boolean;
}

/* ── Error code mapping ── */

const STATUS_TO_CODE: Record<number, number> = {
  400: 40001,
  401: 40100,
  403: 40101,
  404: 40400,
  409: 40900,
  429: 42900,
};

/**
 * Wrap an API route handler with:
 * - Authentication & authorization checks
 * - Unified error handling (AppError → structured JSON)
 * - Consistent logging
 *
 * Usage:
 * ```ts
 * export const GET = apiHandler(async (req) => {
 *   const data = await getSomething();
 *   return NextResponse.json(success(data));
 * });
 *
 * export const POST = apiHandler(async (req, { user }) => {
 *   // user is available when requireAuth is true
 * }, { requireAuth: true });
 * ```
 */
export function apiHandler<T = unknown>(
  handler: ApiHandler<T>,
  config?: RouteConfig,
) {
  return async (
    req: NextRequest,
    routeContext: { params: Promise<T> },
  ): Promise<NextResponse> => {
    try {
      // ── Auth check ──────────────────────────────────────────────
      let user: JwtPayload | undefined;

      if (config?.requireAdmin) {
        const result = requireAdmin(req);
        if (result.error) return result.error;
        user = result.user;
      } else if (config?.requireAuth) {
        const result = requireAuth(req);
        if (result.error) return result.error;
        user = result.user;
      }

      // ── Execute handler ─────────────────────────────────────────
      const params = await routeContext.params;
      return await handler(req, { params, user });
    } catch (error) {
      // ── Handle known AppErrors ────────────────────────────────
      if (error instanceof AppError) {
        const code = STATUS_TO_CODE[error.statusCode] ?? 50000;
        return NextResponse.json(
          fail(code, error.message),
          { status: error.statusCode },
        );
      }

      // ── Handle Prisma unique constraint violations ─────────────
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        return NextResponse.json(
          fail(40900, "该记录已存在"),
          { status: 409 },
        );
      }

      // ── Handle unexpected errors ──────────────────────────────
      console.error(
        `[API Error] ${req.method} ${req.nextUrl.pathname}:`,
        error,
      );
      return NextResponse.json(
        fail(50000, "服务器内部错误"),
        { status: 500 },
      );
    }
  };
}
