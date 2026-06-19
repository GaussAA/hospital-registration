import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/shared/utils/jwt";
import type { JwtPayload } from "@/shared/utils/jwt";

export interface AuthResult {
  user?: JwtPayload;
  error?: NextResponse;
}

/**
 * Verify authentication — checks JWT token from cookies.
 * Returns { user } on success, { error: NextResponse } on failure.
 */
export function requireAuth(req: NextRequest): AuthResult {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return {
      error: NextResponse.json({ code: 40100, data: null, message: "未认证" }, { status: 401 }),
    };
  }

  try {
    const user = verifyToken(token);
    return { user };
  } catch {
    return {
      error: NextResponse.json({ code: 40100, data: null, message: "Token 无效或已过期" }, { status: 401 }),
    };
  }
}

/**
 * Verify admin role — extends requireAuth with admin role check.
 * Returns { user } on success, { error: NextResponse } on failure.
 */
export function requireAdmin(req: NextRequest): AuthResult {
  const { user, error } = requireAuth(req);
  if (error) return { error };

  if (user!.role !== "admin") {
    return {
      error: NextResponse.json({ code: 40101, data: null, message: "权限不足" }, { status: 403 }),
    };
  }

  return { user };
}

/**
 * Server-side auth check for React Server Components.
 * Checks JWT from the server cookie store.
 */
export async function requireAuthServer(): Promise<{
  user?: JwtPayload;
  error?: true;
}> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return { error: true };

  try {
    const user = verifyToken(token);
    return { user };
  } catch {
    return { error: true };
  }
}
