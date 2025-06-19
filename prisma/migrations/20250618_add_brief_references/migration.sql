-- CreateTable
CREATE TABLE "BriefReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "briefId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "highlightedText" TEXT NOT NULL,
    "context" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BriefReference_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BriefReference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BriefReference_briefId_idx" ON "BriefReference"("briefId");
CREATE INDEX "BriefReference_sourceId_idx" ON "BriefReference"("sourceId");
