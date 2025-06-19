-- CreateTable
CREATE TABLE "ExportHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "options" TEXT,
    "errorMessage" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExportUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExportUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "Brief_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ResearchAIModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Brief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Brief_parentBriefId_fkey" FOREIGN KEY ("parentBriefId") REFERENCES "Brief" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Brief" ("abstract", "accuracy", "changeLog", "createdAt", "id", "isActive", "isDraft", "modelId", "parentBriefId", "prompt", "published", "readTime", "response", "slug", "thinking", "title", "updatedAt", "userId", "versionNumber", "viewCount") SELECT "abstract", "accuracy", "changeLog", "createdAt", "id", "isActive", "isDraft", "modelId", "parentBriefId", "prompt", "published", "readTime", "response", "slug", "thinking", "title", "updatedAt", "userId", "versionNumber", "viewCount" FROM "Brief";
DROP TABLE "Brief";
ALTER TABLE "new_Brief" RENAME TO "Brief";
CREATE UNIQUE INDEX "Brief_slug_key" ON "Brief"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ExportHistory_userId_idx" ON "ExportHistory"("userId");

-- CreateIndex
CREATE INDEX "ExportHistory_createdAt_idx" ON "ExportHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ExportUsage_userId_idx" ON "ExportUsage"("userId");

-- CreateIndex
CREATE INDEX "ExportUsage_date_idx" ON "ExportUsage"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ExportUsage_userId_date_key" ON "ExportUsage"("userId", "date");
