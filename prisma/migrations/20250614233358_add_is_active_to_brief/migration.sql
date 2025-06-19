/*
  Warnings:

  - You are about to alter the column `accuracy` on the `Brief` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Brief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "abstract" TEXT,
    "thinking" TEXT,
    "modelId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER NOT NULL DEFAULT 0,
    "accuracy" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "parentBriefId" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "changeLog" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Brief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Brief_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ResearchAIModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Brief_parentBriefId_fkey" FOREIGN KEY ("parentBriefId") REFERENCES "Brief" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Brief" ("abstract", "accuracy", "changeLog", "createdAt", "id", "isDraft", "modelId", "parentBriefId", "prompt", "published", "readTime", "response", "slug", "thinking", "title", "updatedAt", "userId", "versionNumber", "viewCount") SELECT "abstract", coalesce("accuracy", 0) AS "accuracy", "changeLog", "createdAt", "id", "isDraft", "modelId", "parentBriefId", "prompt", "published", coalesce("readTime", 0) AS "readTime", "response", "slug", "thinking", "title", "updatedAt", "userId", "versionNumber", "viewCount" FROM "Brief";
DROP TABLE "Brief";
ALTER TABLE "new_Brief" RENAME TO "Brief";
CREATE UNIQUE INDEX "Brief_slug_key" ON "Brief"("slug");
CREATE INDEX "Brief_userId_idx" ON "Brief"("userId");
CREATE INDEX "Brief_modelId_idx" ON "Brief"("modelId");
CREATE INDEX "Brief_parentBriefId_idx" ON "Brief"("parentBriefId");
CREATE INDEX "Brief_versionNumber_idx" ON "Brief"("versionNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
