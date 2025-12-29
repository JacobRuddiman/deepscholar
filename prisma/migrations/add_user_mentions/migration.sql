-- Create Mention table for tracking @mentions in content
CREATE TABLE "Mention" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "mentionedUserId" TEXT NOT NULL,
  "mentionerId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL, -- 'review', 'comment', 'brief'
  "contentId" TEXT NOT NULL,
  "content" TEXT, -- Snippet of text containing the mention
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("mentionerId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "Mention_mentionedUserId_idx" ON "Mention"("mentionedUserId");
CREATE INDEX "Mention_mentionerId_idx" ON "Mention"("mentionerId");
CREATE INDEX "Mention_contentType_idx" ON "Mention"("contentType");
CREATE INDEX "Mention_contentId_idx" ON "Mention"("contentId");
CREATE INDEX "Mention_createdAt_idx" ON "Mention"("createdAt" DESC);
