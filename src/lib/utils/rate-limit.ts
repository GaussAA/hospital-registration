/**
 * Simple in-memory rate limiter for middleware use.
 * Tracks requests by IP and enforces per-endpoint limits.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request should be rate-limited.
 *
 * @param key - Unique identifier (e.g., IP + path prefix)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60_000)
 * @returns True if the request is allowed, false if rate-limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): boolean {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Extract a rate-limit key from the request.
 * Falls back to "unknown" if IP cannot be determined.
 */
export function getRateLimitKey(
  request: Request,
  pathPrefix: string,
): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${ip}:${pathPrefix}`;
}
