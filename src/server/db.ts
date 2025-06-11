import { PrismaClient } from "@prisma/client";
import { isLocalMode } from "@/lib/localMode";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In LOCAL mode, use SQLite. In production, use the configured database
export const db = isLocalMode()
  ? new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      },
      log: ["query", "error", "warn"]
    })
  : globalForPrisma.prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

if (!isLocalMode() && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
