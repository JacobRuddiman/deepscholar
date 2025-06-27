-- CreateTable
CREATE TABLE "EmailFooter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailSend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailSend_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
