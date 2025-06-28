/*
  Warnings:

  - You are about to drop the column `averageRatingGiven` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `combinedCategories` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `commonCitationSites` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `commonInteractedUsers` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `commonTitleWords` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `createdBriefCategories` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `interactedBriefCategories` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `preferredReadingTime` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to drop the column `totalLikes` on the `UserRecommendation` table. All the data in the column will be lost.
  - You are about to alter the column `searchKeywords` on the `UserRecommendation` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `lastSearchQueries` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topCitationDomains` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topCombinedCategories` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topCombinedTitleWords` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topCreatedCategories` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topCreatedTitleWords` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topInteractedCategories` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topInteractedTitleWords` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topInteractedUsers` to the `UserRecommendation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topCreatedCategories" JSONB NOT NULL,
    "topInteractedCategories" JSONB NOT NULL,
    "topCombinedCategories" JSONB NOT NULL,
    "topCreatedTitleWords" JSONB NOT NULL,
    "topInteractedTitleWords" JSONB NOT NULL,
    "topCombinedTitleWords" JSONB NOT NULL,
    "totalBriefsCreated" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalUpvotes" INTEGER NOT NULL DEFAULT 0,
    "totalSaves" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalReviewsReceived" INTEGER NOT NULL DEFAULT 0,
    "totalUpvotesReceived" INTEGER NOT NULL DEFAULT 0,
    "searchKeywords" JSONB NOT NULL,
    "lastSearchQueries" JSONB NOT NULL,
    "topInteractedUsers" JSONB NOT NULL,
    "topCitationDomains" JSONB NOT NULL,
    "avgBriefReadTime" REAL,
    "avgSessionDuration" REAL,
    "preferredTimeOfDay" TEXT,
    "engagementScore" REAL,
    "contentQualityScore" REAL,
    "lastCalculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserRecommendation" ("contentQualityScore", "createdAt", "engagementScore", "id", "lastCalculated", "searchKeywords", "totalBriefsCreated", "totalReviews", "totalSaves", "totalViews", "updatedAt", "userId") SELECT "contentQualityScore", "createdAt", "engagementScore", "id", "lastCalculated", "searchKeywords", "totalBriefsCreated", "totalReviews", "totalSaves", "totalViews", "updatedAt", "userId" FROM "UserRecommendation";
DROP TABLE "UserRecommendation";
ALTER TABLE "new_UserRecommendation" RENAME TO "UserRecommendation";
CREATE UNIQUE INDEX "UserRecommendation_userId_key" ON "UserRecommendation"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
