import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  (() => {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    
    // Enable WAL mode and set a 5-second busy timeout to prevent "database is locked" errors
    client.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch((err) => {
      console.error("Prisma SQLite: Failed to enable WAL mode", err);
    });
    client.$queryRawUnsafe("PRAGMA busy_timeout=5000;").catch((err) => {
      console.error("Prisma SQLite: Failed to set busy timeout", err);
    });

    return client;
  })();

globalForPrisma.prisma = prisma;

