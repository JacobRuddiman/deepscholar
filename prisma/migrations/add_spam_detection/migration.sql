-- Create SpamDetectionLog table for tracking spam attempts
CREATE TABLE "SpamDetectionLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL, -- 'brief', 'review', 'comment'
  "content" TEXT NOT NULL,
  "spamScore" INTEGER NOT NULL,
  "reasons" TEXT NOT NULL,
  "action" TEXT NOT NULL, -- 'allow', 'flag', 'hide', 'ban'
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX "SpamDetectionLog_userId_idx" ON "SpamDetectionLog"("userId");
CREATE INDEX "SpamDetectionLog_action_idx" ON "SpamDetectionLog"("action");
CREATE INDEX "SpamDetectionLog_spamScore_idx" ON "SpamDetectionLog"("spamScore" DESC);
CREATE INDEX "SpamDetectionLog_createdAt_idx" ON "SpamDetectionLog"("createdAt" DESC);
