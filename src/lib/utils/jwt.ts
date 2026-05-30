import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ?? "hospital-registration-jwt-secret-dev";

export interface JwtPayload {
  userId: string;
  role: string;
}

/**
 * Sign a JWT token with the given payload.
 * Expires in 7 days.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT token.
 * @returns The decoded payload.
 * @throws If the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
