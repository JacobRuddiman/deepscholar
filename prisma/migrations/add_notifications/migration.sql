-- Create Notification table
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "actionUrl" TEXT,
  "relatedId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" DATETIME,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

-- Create NotificationPreference table
CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT NOT NULL UNIQUE,

  -- In-app notification preferences
  "inAppNewFollow" BOOLEAN NOT NULL DEFAULT true,
  "inAppNewReview" BOOLEAN NOT NULL DEFAULT true,
  "inAppNewUpvote" BOOLEAN NOT NULL DEFAULT true,
  "inAppBriefPublished" BOOLEAN NOT NULL DEFAULT true,
  "inAppMention" BOOLEAN NOT NULL DEFAULT true,

  -- Email notification preferences
  "emailNewFollow" BOOLEAN NOT NULL DEFAULT true,
  "emailNewReview" BOOLEAN NOT NULL DEFAULT true,
  "emailNewUpvote" BOOLEAN NOT NULL DEFAULT false,
  "emailBriefPublished" BOOLEAN NOT NULL DEFAULT true,
  "emailMention" BOOLEAN NOT NULL DEFAULT true,
  "emailDigest" BOOLEAN NOT NULL DEFAULT true,
  "emailDigestFrequency" TEXT NOT NULL DEFAULT 'weekly',

  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create index for user preferences
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");
