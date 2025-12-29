-- Add scheduling fields to Brief table
ALTER TABLE "Brief" ADD COLUMN "scheduledFor" DATETIME;
ALTER TABLE "Brief" ADD COLUMN "publishedBy" TEXT; -- 'user' or 'scheduler'

-- Create ScheduledPublication table for tracking scheduled items
CREATE TABLE "ScheduledPublication" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "briefId" TEXT NOT NULL UNIQUE,
  "scheduledFor" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'published', 'failed', 'cancelled'
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" DATETIME,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "ScheduledPublication_scheduledFor_idx" ON "ScheduledPublication"("scheduledFor");
CREATE INDEX "ScheduledPublication_status_idx" ON "ScheduledPublication"("status");
CREATE INDEX "ScheduledPublication_briefId_idx" ON "ScheduledPublication"("briefId");

-- Index on Brief for scheduled items
CREATE INDEX "Brief_scheduledFor_idx" ON "Brief"("scheduledFor");
