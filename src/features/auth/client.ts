/**
 * Client-safe exports for the auth module.
 * Use this file instead of `@/features/auth` when importing from client components
 * to avoid dragging in server-only code (Prisma, next/headers, etc.).
 */
export { default as LoginForm } from "./components/LoginForm";
export { default as RegisterForm } from "./components/RegisterForm";
export { UserProvider, useUser } from "./components/UserProvider";
