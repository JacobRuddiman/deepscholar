-- CreateTable
CREATE TABLE "SeedingMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastSeedDate" DATETIME NOT NULL,
    "seedVersion" TEXT NOT NULL,
    "totalSeedRecords" INTEGER NOT NULL,
    "config" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Brief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "abstract" TEXT,
    "thinking" TEXT,
    "modelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER,
    "accuracy" REAL,
    "slug" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentBriefId" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "changeLog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Brief_parentBriefId_fkey" FOREIGN KEY ("parentBriefId") REFERENCES "Brief" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Brief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Brief_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ResearchAIModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Brief" ("abstract", "accuracy", "changeLog", "createdAt", "id", "isActive", "isDraft", "modelId", "parentBriefId", "prompt", "published", "readTime", "response", "slug", "thinking", "title", "updatedAt", "userId", "versionNumber", "viewCount") SELECT "abstract", "accuracy", "changeLog", "createdAt", "id", "isActive", "isDraft", "modelId", "parentBriefId", "prompt", "published", "readTime", "response", "slug", "thinking", "title", "updatedAt", "userId", "versionNumber", "viewCount" FROM "Brief";
DROP TABLE "Brief";
ALTER TABLE "new_Brief" RENAME TO "Brief";
CREATE UNIQUE INDEX "Brief_slug_key" ON "Brief"("slug");
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
    "updatedAt" DATETIME NOT NULL,
    "isSeedData" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("briefInterestUpdates", "createdAt", "email", "emailNotifications", "emailVerified", "id", "image", "isAdmin", "lastInteractionDate", "lastPromotionEmailDate", "name", "promotionalNotifications", "updatedAt") SELECT "briefInterestUpdates", "createdAt", "email", "emailNotifications", "emailVerified", "id", "image", "isAdmin", "lastInteractionDate", "lastPromotionEmailDate", "name", "promotionalNotifications", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
