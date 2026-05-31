import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { env } from "@/lib/env";

let prisma: PrismaClient | null = null;
let initPromise: Promise<PrismaClient> | null = null;

async function initPrisma(): Promise<PrismaClient> {
  try {
    const adapter = new PrismaLibSql({ url: env.DATABASE_URL });
    const client = new PrismaClient({ adapter });
    return client;
  } catch (error) {
    console.error("[DB] Failed to initialize Prisma:", error);
    throw error;
  }
}

/**
 * Get the Prisma client singleton, initializing with the libsql adapter if needed.
 * Must be called within an async context (e.g., API route handlers).
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (prisma) return prisma;
  if (!initPromise) {
    initPromise = initPrisma().then((client) => {
      prisma = client;
      return client;
    });
  }
  return initPromise;
}
