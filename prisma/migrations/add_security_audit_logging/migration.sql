-- Create SecurityAuditLog table for tracking security events
CREATE TABLE "SecurityAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  "userId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "event" TEXT NOT NULL, -- 'login', 'logout', 'password_change', 'email_change', etc.
  "action" TEXT NOT NULL, -- 'success', 'failure', 'attempt'
  "details" TEXT, -- JSON string with additional details
  "severity" TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create indexes for efficient queries
CREATE INDEX "SecurityAuditLog_userId_idx" ON "SecurityAuditLog"("userId");
CREATE INDEX "SecurityAuditLog_event_idx" ON "SecurityAuditLog"("event");
CREATE INDEX "SecurityAuditLog_action_idx" ON "SecurityAuditLog"("action");
CREATE INDEX "SecurityAuditLog_severity_idx" ON "SecurityAuditLog"("severity");
CREATE INDEX "SecurityAuditLog_createdAt_idx" ON "SecurityAuditLog"("createdAt" DESC);
CREATE INDEX "SecurityAuditLog_ipAddress_idx" ON "SecurityAuditLog"("ipAddress");
