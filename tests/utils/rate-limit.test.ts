import { describe, it, expect } from "vitest";
import { checkRateLimit, getRateLimitKey } from "../../src/lib/utils/rate-limit";

describe("rate limiter", () => {
  it("should allow the first request", () => {
    const key = `test-allow-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("should allow requests within the limit", () => {
    const key = `test-within-limit-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("should block requests exceeding the limit", () => {
    const key = `test-exceed-${Date.now()}`;
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false); // blocked
  });

  it("should reset after the window expires", async () => {
    const key = `test-reset-${Date.now()}`;
    expect(checkRateLimit(key, 1, 100)).toBe(true); // allowed
    expect(checkRateLimit(key, 1, 100)).toBe(false); // blocked
    await new Promise((r) => setTimeout(r, 150)); // wait for window to expire
    expect(checkRateLimit(key, 1, 100)).toBe(true); // allowed again
  });

  it("should have separate counters for different keys", () => {
    const keyA = `test-separate-A-${Date.now()}`;
    const keyB = `test-separate-B-${Date.now()}`;
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(true);
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(false); // A blocked
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(false); // B blocked
  });
});

describe("getRateLimitKey", () => {
  it("should create a combined key from IP and path", () => {
    const url = new URL("http://example.com/api/auth/login");
    const request = new Request(url);
    const key = getRateLimitKey(request, "auth");
    expect(key).toContain(":auth");
    // IP falls back to "unknown" in test environment
    expect(key).toContain("unknown:");
  });

  it("should respect x-forwarded-for header", () => {
    const url = new URL("http://example.com/api/auth/login");
    const request = new Request(url, {
      headers: { "x-forwarded-for": "203.0.113.42" },
    });
    const key = getRateLimitKey(request, "auth");
    expect(key).toBe("203.0.113.42:auth");
  });
});
