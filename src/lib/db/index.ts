import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let initPromise: Promise<PrismaClient> | null = null;

async function initPrisma(): Promise<PrismaClient> {
  const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
  const client = new PrismaClient({
    adapter,
  });
  return client;
}

/**
 * Get the Prisma client singleton, initializing with the libsql adapter if needed.
 * Must be called within an async context (e.g., API route handlers).
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  if (!initPromise) {
    initPromise = initPrisma().then((client) => {
      globalForPrisma.prisma = client;
      return client;
    });
  }
  return initPromise;
}
