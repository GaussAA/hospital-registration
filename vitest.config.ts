import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    env: {
      JWT_SECRET: "test-jwt-secret-for-vitest",
    },
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // Component tests use jsdom via @vitest-environment jsdom directive
    coverage: {
      provider: "v8",
      include: ["src/lib/services/**/*.ts"],
      exclude: ["**/index.ts", "**/*.config.*"],
      reporter: ["text", "html"],
    },
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@generated": path.resolve(__dirname, "./generated"),
    },
  },
});
