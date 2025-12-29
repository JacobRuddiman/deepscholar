-- Create BotDetectionLog table for tracking bot detection attempts
CREATE TABLE "BotDetectionLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "botScore" INTEGER NOT NULL,
  "reasons" TEXT NOT NULL,
  "action" TEXT NOT NULL, -- 'allow', 'captcha', 'block', 'rate_limit'
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create RequestLog table for rate limiting
CREATE TABLE "RequestLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT,
  "ipAddress" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create RateLimitEntry table for tracking rate-limited IPs/users
CREATE TABLE "RateLimitEntry" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "identifier" TEXT NOT NULL UNIQUE, -- Format: "ip:userId"
  "ipAddress" TEXT NOT NULL,
  "userId" TEXT,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX "BotDetectionLog_userId_idx" ON "BotDetectionLog"("userId");
CREATE INDEX "BotDetectionLog_ipAddress_idx" ON "BotDetectionLog"("ipAddress");
CREATE INDEX "BotDetectionLog_action_idx" ON "BotDetectionLog"("action");
CREATE INDEX "BotDetectionLog_botScore_idx" ON "BotDetectionLog"("botScore" DESC);
CREATE INDEX "BotDetectionLog_createdAt_idx" ON "BotDetectionLog"("createdAt" DESC);

CREATE INDEX "RequestLog_userId_idx" ON "RequestLog"("userId");
CREATE INDEX "RequestLog_ipAddress_idx" ON "RequestLog"("ipAddress");
CREATE INDEX "RequestLog_createdAt_idx" ON "RequestLog"("createdAt" DESC);

CREATE INDEX "RateLimitEntry_identifier_idx" ON "RateLimitEntry"("identifier");
CREATE INDEX "RateLimitEntry_ipAddress_idx" ON "RateLimitEntry"("ipAddress");
CREATE INDEX "RateLimitEntry_expiresAt_idx" ON "RateLimitEntry"("expiresAt");
