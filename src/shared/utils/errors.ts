/**
 * Base application error with status code and error code.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Authentication error — 401.
 */
export class AuthError extends AppError {
  constructor(message = "未认证") {
    super(message, "UNAUTHORIZED", 401);
  }
}

/**
 * Forbidden error — 403.
 */
export class ForbiddenError extends AppError {
  constructor(message = "权限不足") {
    super(message, "FORBIDDEN", 403);
  }
}

/**
 * Not found error — 404.
 */
export class NotFoundError extends AppError {
  constructor(message = "资源不存在") {
    super(message, "NOT_FOUND", 404);
  }
}

/**
 * Validation error — 400.
 */
export class ValidationError extends AppError {
  constructor(message = "请求参数错误") {
    super(message, "VALIDATION_ERROR", 400);
  }
}

/**
 * Conflict error — 409.
 */
export class ConflictError extends AppError {
  constructor(message = "资源冲突") {
    super(message, "CONFLICT", 409);
  }
}
