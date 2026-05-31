import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { signToken, verifyToken } from "../../src/lib/utils/jwt";

describe("JWT utility", () => {
  it("should sign a token with userId and role", () => {
    const payload = { userId: "user-123", role: "patient" };
    const token = signToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts
  });

  it("should verify a valid token and return the payload", () => {
    const payload = { userId: "user-456", role: "admin" };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe("user-456");
    expect(decoded.role).toBe("admin");
  });

  it("should throw on an invalid token", () => {
    expect(() => verifyToken("invalid-token")).toThrow();
  });

  it("should throw on a token signed with a different secret", () => {
    const token = jwt.sign(
      { userId: "test", role: "patient" },
      "different-secret"
    );
    expect(() => verifyToken(token)).toThrow();
  });
});
