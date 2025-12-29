-- Create UserReputation table
CREATE TABLE "UserReputation" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL UNIQUE,

  -- Reputation points
  "points" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "rank" TEXT NOT NULL DEFAULT 'Beginner',

  -- Activity counters
  "briefsPublished" INTEGER NOT NULL DEFAULT 0,
  "reviewsWritten" INTEGER NOT NULL DEFAULT 0,
  "upvotesReceived" INTEGER NOT NULL DEFAULT 0,
  "helpfulReviews" INTEGER NOT NULL DEFAULT 0,
  "followersCount" INTEGER NOT NULL DEFAULT 0,

  -- Streak tracking
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastActivityDate" DATETIME,

  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create Badge table
CREATE TABLE "Badge" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "rarity" TEXT NOT NULL DEFAULT 'common',
  "requiredPoints" INTEGER,
  "requiredAction" TEXT,
  "requiredCount" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create UserBadge junction table
CREATE TABLE "UserBadge" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE,

  UNIQUE("userId", "badgeId")
);

-- Create ReputationHistory table
CREATE TABLE "ReputationHistory" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "reason" TEXT,
  "relatedId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "UserReputation_userId_idx" ON "UserReputation"("userId");
CREATE INDEX "UserReputation_points_idx" ON "UserReputation"("points" DESC);
CREATE INDEX "UserReputation_level_idx" ON "UserReputation"("level" DESC);
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");
CREATE INDEX "ReputationHistory_userId_idx" ON "ReputationHistory"("userId");
CREATE INDEX "ReputationHistory_createdAt_idx" ON "ReputationHistory"("createdAt" DESC);

-- Insert default badges
INSERT INTO "Badge" ("id", "name", "description", "icon", "category", "rarity", "requiredAction", "requiredCount") VALUES
  (lower(hex(randomblob(16))), 'First Brief', 'Published your first research brief', '📝', 'creation', 'common', 'brief_published', 1),
  (lower(hex(randomblob(16))), 'Prolific Writer', 'Published 10 research briefs', '✍️', 'creation', 'uncommon', 'brief_published', 10),
  (lower(hex(randomblob(16))), 'Research Master', 'Published 50 research briefs', '🎓', 'creation', 'rare', 'brief_published', 50),
  (lower(hex(randomblob(16))), 'Scholar', 'Published 100 research briefs', '👨‍🎓', 'creation', 'epic', 'brief_published', 100),

  (lower(hex(randomblob(16))), 'First Review', 'Wrote your first review', '💭', 'community', 'common', 'review_written', 1),
  (lower(hex(randomblob(16))), 'Critical Thinker', 'Wrote 25 reviews', '🤔', 'community', 'uncommon', 'review_written', 25),
  (lower(hex(randomblob(16))), 'Review Expert', 'Wrote 100 reviews', '⭐', 'community', 'rare', 'review_written', 100),

  (lower(hex(randomblob(16))), 'Rising Star', 'Received 10 upvotes', '🌟', 'popularity', 'common', 'upvotes_received', 10),
  (lower(hex(randomblob(16))), 'Popular', 'Received 50 upvotes', '🔥', 'popularity', 'uncommon', 'upvotes_received', 50),
  (lower(hex(randomblob(16))), 'Viral', 'Received 200 upvotes', '🚀', 'popularity', 'rare', 'upvotes_received', 200),

  (lower(hex(randomblob(16))), 'Helpful', 'Had 10 reviews marked as helpful', '👍', 'quality', 'uncommon', 'helpful_reviews', 10),
  (lower(hex(randomblob(16))), 'Invaluable', 'Had 50 reviews marked as helpful', '💎', 'quality', 'rare', 'helpful_reviews', 50),

  (lower(hex(randomblob(16))), 'Influencer', 'Gained 25 followers', '👥', 'social', 'uncommon', 'followers_count', 25),
  (lower(hex(randomblob(16))), 'Community Leader', 'Gained 100 followers', '👑', 'social', 'rare', 'followers_count', 100),

  (lower(hex(randomblob(16))), 'Consistent', '7-day activity streak', '📅', 'dedication', 'uncommon', 'current_streak', 7),
  (lower(hex(randomblob(16))), 'Dedicated', '30-day activity streak', '🔥', 'dedication', 'rare', 'current_streak', 30),
  (lower(hex(randomblob(16))), 'Unstoppable', '100-day activity streak', '⚡', 'dedication', 'epic', 'current_streak', 100);
