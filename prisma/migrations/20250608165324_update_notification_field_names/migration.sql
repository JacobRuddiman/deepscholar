/*
  Warnings:

  - You are about to drop the column `briefUpdates` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `reviewNotifications` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tokenAlerts` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastInteractionDate" DATETIME,
    "lastPromotionEmailDate" DATETIME,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "briefInterestUpdates" BOOLEAN NOT NULL DEFAULT true,
    "promotionalNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailNotifications", "emailVerified", "id", "image", "isAdmin", "lastInteractionDate", "lastPromotionEmailDate", "name", "updatedAt") SELECT "createdAt", "email", "emailNotifications", "emailVerified", "id", "image", "isAdmin", "lastInteractionDate", "lastPromotionEmailDate", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
