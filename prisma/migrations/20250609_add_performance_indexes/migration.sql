-- Add indexes for frequently queried fields

-- Brief indexes for performance
CREATE INDEX IF NOT EXISTS "Brief_viewCount_idx" ON "Brief"("viewCount" DESC);
CREATE INDEX IF NOT EXISTS "Brief_createdAt_idx" ON "Brief"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Brief_published_idx" ON "Brief"("published");
CREATE INDEX IF NOT EXISTS "Brief_userId_idx" ON "Brief"("userId");
CREATE INDEX IF NOT EXISTS "Brief_modelId_idx" ON "Brief"("modelId");
CREATE INDEX IF NOT EXISTS "Brief_slug_idx" ON "Brief"("slug");

-- Review indexes
CREATE INDEX IF NOT EXISTS "Review_briefId_idx" ON "Review"("briefId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt" DESC);

-- BriefUpvote indexes
CREATE INDEX IF NOT EXISTS "BriefUpvote_briefId_idx" ON "BriefUpvote"("briefId");
CREATE INDEX IF NOT EXISTS "BriefUpvote_userId_idx" ON "BriefUpvote"("userId");
CREATE INDEX IF NOT EXISTS "BriefUpvote_createdAt_idx" ON "BriefUpvote"("createdAt" DESC);

-- SavedBrief indexes
CREATE INDEX IF NOT EXISTS "SavedBrief_userId_idx" ON "SavedBrief"("userId");
CREATE INDEX IF NOT EXISTS "SavedBrief_briefId_idx" ON "SavedBrief"("briefId");
CREATE INDEX IF NOT EXISTS "SavedBrief_createdAt_idx" ON "SavedBrief"("createdAt" DESC);

-- BriefView indexes
CREATE INDEX IF NOT EXISTS "BriefView_userId_idx" ON "BriefView"("userId");
CREATE INDEX IF NOT EXISTS "BriefView_briefId_idx" ON "BriefView"("briefId");
CREATE INDEX IF NOT EXISTS "BriefView_createdAt_idx" ON "BriefView"("createdAt" DESC);

-- TokenTransaction indexes
CREATE INDEX IF NOT EXISTS "TokenTransaction_userId_idx" ON "TokenTransaction"("userId");
CREATE INDEX IF NOT EXISTS "TokenTransaction_createdAt_idx" ON "TokenTransaction"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "TokenTransaction_briefId_idx" ON "TokenTransaction"("briefId");

-- User indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "User_isAdmin_idx" ON "User"("isAdmin");

-- Category indexes
CREATE INDEX IF NOT EXISTS "Category_name_idx" ON "Category"("name");

-- Source indexes
CREATE INDEX IF NOT EXISTS "Source_url_idx" ON "Source"("url");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "Brief_published_createdAt_idx" ON "Brief"("published", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Brief_published_viewCount_idx" ON "Brief"("published", "viewCount" DESC);
CREATE INDEX IF NOT EXISTS "Brief_userId_published_idx" ON "Brief"("userId", "published");
CREATE INDEX IF NOT EXISTS "Review_briefId_createdAt_idx" ON "Review"("briefId", "createdAt" DESC);
