import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "@/shared/utils/password";

describe("password utility", () => {
  it("should hash a password and verify it correctly", async () => {
    const password = "testPassword123!";
    const hash = await hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash).toContain("$2"); // bcrypt hash marker
  });

  it("should return true for correct password comparison", async () => {
    const password = "mySecret123";
    const hash = await hashPassword(password);
    const valid = await comparePassword(password, hash);
    expect(valid).toBe(true);
  });

  it("should return false for incorrect password comparison", async () => {
    const password = "correctPassword";
    const wrongPassword = "wrongPassword";
    const hash = await hashPassword(password);
    const valid = await comparePassword(wrongPassword, hash);
    expect(valid).toBe(false);
  });

  it("should produce different hashes for the same password (salt works)", async () => {
    const password = "samePassword";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });
});
