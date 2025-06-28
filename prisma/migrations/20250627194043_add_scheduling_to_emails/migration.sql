-- CreateTable
CREATE TABLE "ScheduledEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentBy" TEXT NOT NULL,
    "sentAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledEmail_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ScheduledEmail_scheduledFor_idx" ON "ScheduledEmail"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledEmail_status_idx" ON "ScheduledEmail"("status");
