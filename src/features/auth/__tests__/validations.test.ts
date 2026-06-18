import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/features/auth/validations";

describe("registerSchema", () => {
  it("should accept valid registration data with email", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      email: "zhangsan@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid registration data with phone", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      phone: "13800138000",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should accept when both email and phone are provided", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      email: "zhangsan@example.com",
      phone: "13800138000",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "zhangsan@example.com",
      password: "123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("name"))).toBe(true);
    }
  });

  it("should reject invalid email format", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      email: "not-an-email",
      password: "123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(true);
    }
  });

  it("should accept empty string for email", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      email: "",
      phone: "13800138000",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid phone format", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      phone: "12345",
      password: "123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("phone"))).toBe(true);
    }
  });

  it("should accept empty string for phone", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      email: "zhangsan@example.com",
      phone: "",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject password shorter than 6 characters", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      email: "zhangsan@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("password"))).toBe(true);
    }
  });

  it("should reject when both email and phone are missing (refine)", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      password: "123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "邮箱和手机号至少填一项")).toBe(true);
    }
  });

  it("should reject when both email and phone are empty strings (refine)", () => {
    const result = registerSchema.safeParse({
      name: "张三",
      email: "",
      phone: "",
      password: "123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "邮箱和手机号至少填一项")).toBe(true);
    }
  });
});

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      account: "zhangsan@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty account", () => {
    const result = loginSchema.safeParse({
      account: "",
      password: "123456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("account"))).toBe(true);
    }
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      account: "zhangsan@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("password"))).toBe(true);
    }
  });

  it("should reject when both fields are missing", () => {
    const result = loginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
