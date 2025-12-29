import { PrismaClient } from "@prisma/client";
import { isLocalDb } from "@/lib/localMode";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use LOCAL_DB flag to choose between SQLite and PostgreSQL
export const db = isLocalDb()
  ? new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      },
      log: ["error"]
    })
  : globalForPrisma.prisma ??
    new PrismaClient({
      log: ["error"],
    });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
