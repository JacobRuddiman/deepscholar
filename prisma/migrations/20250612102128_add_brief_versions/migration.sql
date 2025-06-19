-- DropIndex
DROP INDEX "Brief_userId_published_idx";

-- DropIndex
DROP INDEX "Brief_published_viewCount_idx";

-- DropIndex
DROP INDEX "Brief_published_createdAt_idx";

-- DropIndex
DROP INDEX "Brief_slug_idx";

-- DropIndex
DROP INDEX "Brief_modelId_idx";

-- DropIndex
DROP INDEX "Brief_userId_idx";

-- DropIndex
DROP INDEX "Brief_published_idx";

-- DropIndex
DROP INDEX "Brief_createdAt_idx";

-- DropIndex
DROP INDEX "Brief_viewCount_idx";

-- DropIndex
DROP INDEX "BriefUpvote_createdAt_idx";

-- DropIndex
DROP INDEX "BriefUpvote_userId_idx";

-- DropIndex
DROP INDEX "BriefUpvote_briefId_idx";

-- DropIndex
DROP INDEX "BriefView_createdAt_idx";

-- DropIndex
DROP INDEX "BriefView_briefId_idx";

-- DropIndex
DROP INDEX "BriefView_userId_idx";

-- DropIndex
DROP INDEX "Category_name_idx";

-- DropIndex
DROP INDEX "Review_briefId_createdAt_idx";

-- DropIndex
DROP INDEX "Review_createdAt_idx";

-- DropIndex
DROP INDEX "Review_rating_idx";

-- DropIndex
DROP INDEX "Review_userId_idx";

-- DropIndex
DROP INDEX "Review_briefId_idx";

-- DropIndex
DROP INDEX "SavedBrief_createdAt_idx";

-- DropIndex
DROP INDEX "SavedBrief_briefId_idx";

-- DropIndex
DROP INDEX "SavedBrief_userId_idx";

-- DropIndex
DROP INDEX "Source_url_idx";

-- DropIndex
DROP INDEX "TokenTransaction_briefId_idx";

-- DropIndex
DROP INDEX "TokenTransaction_createdAt_idx";

-- DropIndex
DROP INDEX "TokenTransaction_userId_idx";

-- DropIndex
DROP INDEX "User_isAdmin_idx";

-- DropIndex
DROP INDEX "User_createdAt_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- CreateTable
CREATE TABLE "BriefVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "briefId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "abstract" TEXT,
    "thinking" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BriefVersion_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
