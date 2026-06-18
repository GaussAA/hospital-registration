import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET 环境变量未设置。请在 .env 文件中配置：JWT_SECRET=你的密钥"
  );
}

export interface JwtPayload {
  userId: string;
  role: string;
}

/**
 * Sign a JWT token with the given payload.
 * Expires in 7 days (see SESSION_EXPIRY_DAYS in @/lib/constants).
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT token.
 * @returns The decoded payload.
 * @throws If the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET as string) as unknown as JwtPayload;
}
