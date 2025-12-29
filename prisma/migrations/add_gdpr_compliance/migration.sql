-- Create AccountDeletionRequest table for GDPR compliance
CREATE TABLE "AccountDeletionRequest" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL,
  "reason" TEXT,
  "publishedBriefsCount" INTEGER NOT NULL DEFAULT 0,
  "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" DATETIME,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "AccountDeletionRequest_userId_idx" ON "AccountDeletionRequest"("userId");
CREATE INDEX "AccountDeletionRequest_requestedAt_idx" ON "AccountDeletionRequest"("requestedAt" DESC);
CREATE INDEX "AccountDeletionRequest_deletedAt_idx" ON "AccountDeletionRequest"("deletedAt");

-- Create a special "deleted-user" placeholder for anonymized content
-- This is used when users delete their account but have published briefs
INSERT OR IGNORE INTO "User" ("id", "name", "email", "emailVerified")
VALUES (
  'deleted-user',
  'Deleted User',
  'deleted@deepscholar.local',
  datetime('now')
);
