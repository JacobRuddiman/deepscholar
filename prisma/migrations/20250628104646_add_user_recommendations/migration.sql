-- CreateTable
CREATE TABLE "UserRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdBriefCategories" TEXT NOT NULL,
    "interactedBriefCategories" TEXT NOT NULL,
    "combinedCategories" TEXT NOT NULL,
    "commonTitleWords" TEXT NOT NULL,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalBriefsCreated" INTEGER NOT NULL DEFAULT 0,
    "searchKeywords" TEXT NOT NULL DEFAULT '[]',
    "commonInteractedUsers" TEXT NOT NULL,
    "commonCitationSites" TEXT NOT NULL,
    "averageRatingGiven" REAL,
    "preferredReadingTime" TEXT,
    "engagementScore" REAL,
    "contentQualityScore" REAL,
    "lastCalculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRecommendation_userId_key" ON "UserRecommendation"("userId");

-- CreateIndex
CREATE INDEX "UserRecommendation_userId_idx" ON "UserRecommendation"("userId");

-- CreateIndex
CREATE INDEX "UserRecommendation_lastCalculated_idx" ON "UserRecommendation"("lastCalculated");
