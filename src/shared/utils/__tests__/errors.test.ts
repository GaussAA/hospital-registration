import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/shared/utils/errors";

describe("AppError hierarchy", () => {
  it("should create an AuthError with correct status and code", () => {
    const err = new AuthError();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("未认证");
  });

  it("should create a ForbiddenError with correct status", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("should create a NotFoundError with custom message", () => {
    const err = new NotFoundError("医院不存在");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("医院不存在");
  });

  it("should create a ValidationError", () => {
    const err = new ValidationError("参数错误");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("should create a ConflictError", () => {
    const err = new ConflictError("号源已满");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("should preserve stack trace", () => {
    const err = new NotFoundError();
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("errors.test");
  });
});
