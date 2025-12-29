# Schema Updates - Social Features, Notifications & Reputation

Add the following to your `prisma/schema.prisma` file:

## Notification System

### 1. Add Notification model

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // 'follow', 'review', 'upvote', 'publish', 'mention', 'system'
  title     String
  message   String
  read      Boolean  @default(false)
  actionUrl String?  // URL to navigate when clicked
  relatedId String?  // ID of related entity (brief, review, etc.)
  createdAt DateTime @default(now())
  readAt    DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, read])
  @@index([createdAt(sort: Desc)])
}
```

### 2. Add NotificationPreference model

```prisma
model NotificationPreference {
  id     String @id @default(cuid())
  userId String @unique

  // In-app notifications
  inAppNewFollow       Boolean @default(true)
  inAppNewReview       Boolean @default(true)
  inAppNewUpvote       Boolean @default(true)
  inAppBriefPublished  Boolean @default(true)
  inAppMention         Boolean @default(true)

  // Email notifications
  emailNewFollow       Boolean @default(true)
  emailNewReview       Boolean @default(true)
  emailNewUpvote       Boolean @default(false)
  emailBriefPublished  Boolean @default(true)
  emailMention         Boolean @default(true)
  emailDigest          Boolean @default(true)
  emailDigestFrequency String  @default("weekly") // 'daily', 'weekly', 'monthly'

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### 3. Update User model

```prisma
model User {
  // ... existing fields ...

  // Add these relations:
  notifications           Notification[]
  notificationPreferences NotificationPreference?

  // ... rest of existing relations ...
}
```

## Follow System

Add the following to your `prisma/schema.prisma` file:

## 1. Add Follow model (after ReviewHelpful model, around line 358)

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower    User @relation("UserFollowers", fields: [followerId], references: [id], onDelete: Cascade)
  following   User @relation("UserFollowing", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

## 2. Update User model (add these fields to the User model relations, around line 110)

```prisma
model User {
  // ... existing fields ...

  // Add these two lines to the existing relations:
  followers    Follow[] @relation("UserFollowers")
  following    Follow[] @relation("UserFollowing")

  // ... rest of existing relations ...
}
```

## 3. Run migration

```bash
npx prisma migrate dev --name add_follow_system
npx prisma generate
```

This will:
- Create the Follow table
- Add proper foreign key constraints
- Create indexes for efficient queries
- Prevent duplicate follows with unique constraint
- Enable cascade deletion when users are deleted

## Reputation System

Add the following to your `prisma/schema.prisma` file:

### 1. Add UserReputation model

```prisma
model UserReputation {
  id     String @id @default(cuid())
  userId String @unique

  // Reputation points
  points Int @default(0)
  level  Int @default(1)
  rank   String @default("Beginner")

  // Activity counters
  briefsPublished Int @default(0)
  reviewsWritten  Int @default(0)
  upvotesReceived Int @default(0)
  helpfulReviews  Int @default(0)
  followersCount  Int @default(0)

  // Streak tracking
  currentStreak    Int       @default(0)
  longestStreak    Int       @default(0)
  lastActivityDate DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([points(sort: Desc)])
  @@index([level(sort: Desc)])
}
```

### 2. Add Badge model

```prisma
model Badge {
  id          String @id @default(cuid())
  name        String @unique
  description String
  icon        String
  category    String // 'creation', 'community', 'popularity', 'quality', 'social', 'dedication'
  rarity      String @default("common") // 'common', 'uncommon', 'rare', 'epic', 'legendary'

  // Requirements (one of these):
  requiredPoints Int?
  requiredAction String? // 'brief_published', 'review_written', 'upvotes_received', etc.
  requiredCount  Int?

  createdAt DateTime @default(now())

  userBadges UserBadge[]
}
```

### 3. Add UserBadge model

```prisma
model UserBadge {
  id       String   @id @default(cuid())
  userId   String
  badgeId  String
  earnedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge Badge @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@index([userId])
  @@index([badgeId])
}
```

### 4. Add ReputationHistory model

```prisma
model ReputationHistory {
  id        String   @id @default(cuid())
  userId    String
  action    String // 'BRIEF_PUBLISHED', 'BRIEF_UPVOTE_RECEIVED', etc.
  points    Int
  reason    String?
  relatedId String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt(sort: Desc)])
}
```

### 5. Update User model

```prisma
model User {
  // ... existing fields ...

  // Add these relations:
  reputation        UserReputation?
  badges            UserBadge[]
  reputationHistory ReputationHistory[]

  // ... rest of existing relations ...
}
```

### 6. Run migration

```bash
npx prisma migrate dev --name add_reputation_system
npx prisma generate
```

This will:
- Create the UserReputation table
- Create the Badge table (pre-seeded with 17 badges)
- Create the UserBadge junction table
- Create the ReputationHistory table for tracking point changes
- Add proper foreign key constraints
- Create indexes for efficient queries
- Enable cascade deletion when users are deleted

See `REPUTATION_SYSTEM_GUIDE.md` for complete implementation details.

## GDPR Compliance

Add the following to your `prisma/schema.prisma` file:

### 1. Add AccountDeletionRequest model

```prisma
model AccountDeletionRequest {
  id                    String    @id @default(cuid())
  userId                String
  reason                String?
  publishedBriefsCount  Int       @default(0)
  requestedAt           DateTime  @default(now())
  deletedAt             DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([requestedAt(sort: Desc)])
  @@index([deletedAt])
}
```

### 2. Update User model

```prisma
model User {
  // ... existing fields ...

  // Add this relation:
  deletionRequests AccountDeletionRequest[]

  // ... rest of existing relations ...
}
```

### 3. Run migration

```bash
npx prisma migrate dev --name add_gdpr_compliance
npx prisma generate
```

This will:
- Create the AccountDeletionRequest table for tracking deletion requests
- Create a "deleted-user" placeholder account for anonymized content
- Add proper foreign key constraints
- Create indexes for efficient queries
- Enable GDPR Article 17 (Right to Erasure) compliance

See `GDPR_COMPLIANCE_GUIDE.md` for complete implementation details.

## Spam Detection

Add the following to your `prisma/schema.prisma` file:

### 1. Add SpamDetectionLog model

```prisma
model SpamDetectionLog {
  id          String   @id @default(cuid())
  userId      String
  contentType String // 'brief', 'review', 'comment'
  content     String
  spamScore   Int
  reasons     String
  action      String // 'allow', 'flag', 'hide', 'ban'
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([action])
  @@index([spamScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
}
```

### 2. Update User model

```prisma
model User {
  // ... existing fields ...

  // Add this relation:
  spamLogs SpamDetectionLog[]

  // ... rest of existing relations ...
}
```

### 3. Run migration

```bash
npx prisma migrate dev --name add_spam_detection
npx prisma generate
```

This will:
- Create the SpamDetectionLog table for tracking spam detection incidents
- Add proper foreign key constraints
- Create indexes for efficient queries (userId, action, score, timestamp)
- Enable automated spam detection and moderation

See `SPAM_DETECTION_GUIDE.md` for complete implementation details.

## Bot Detection and Prevention

Add the following to your `prisma/schema.prisma` file:

### 1. Add BotDetectionLog model

```prisma
model BotDetectionLog {
  id         String    @id @default(cuid())
  userId     String?
  ipAddress  String
  userAgent  String
  botScore   Int
  reasons    String
  action     String // 'allow', 'captcha', 'block', 'rate_limit'
  createdAt  DateTime  @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([ipAddress])
  @@index([action])
  @@index([botScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
}
```

### 2. Add RequestLog model

```prisma
model RequestLog {
  id         String   @id @default(cuid())
  userId     String?
  ipAddress  String
  userAgent  String
  path       String
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([ipAddress])
  @@index([createdAt(sort: Desc)])
}
```

### 3. Add RateLimitEntry model

```prisma
model RateLimitEntry {
  id           String   @id @default(cuid())
  identifier   String   @unique // Format: "ip:userId"
  ipAddress    String
  userId       String?
  requestCount Int      @default(0)
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([identifier])
  @@index([ipAddress])
  @@index([expiresAt])
}
```

### 4. Update User model

```prisma
model User {
  // ... existing fields ...

  // Add these relations:
  botLogs       BotDetectionLog[]
  requestLogs   RequestLog[]
  rateLimits    RateLimitEntry[]

  // ... rest of existing relations ...
}
```

### 5. Run migration

```bash
npx prisma migrate dev --name add_bot_detection
npx prisma generate
```

This will:
- Create the BotDetectionLog table for tracking bot detection incidents
- Create the RequestLog table for rate limiting
- Create the RateLimitEntry table for managing rate limits
- Add proper foreign key constraints
- Create indexes for efficient queries
- Enable automated bot detection and prevention

See `BOT_DETECTION_GUIDE.md` for complete implementation details.

## Security Audit Logging

Add the following to your `prisma/schema.prisma` file:

### 1. Add SecurityAuditLog model

```prisma
model SecurityAuditLog {
  id         String    @id @default(cuid())
  userId     String?
  ipAddress  String?
  userAgent  String?
  event      String // 'login_success', 'password_change', etc.
  action     String // 'success', 'failure', 'attempt'
  details    String? // JSON string
  severity   String @default("info") // 'info', 'warning', 'critical'
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([event])
  @@index([action])
  @@index([severity])
  @@index([createdAt(sort: Desc)])
  @@index([ipAddress])
}
```

### 2. Update User model

```prisma
model User {
  // ... existing fields ...

  // Add this relation:
  securityLogs SecurityAuditLog[]

  // ... rest of existing relations ...
}
```

### 3. Run migration

```bash
npx prisma migrate dev --name add_security_audit_logging
npx prisma generate
```

This will:
- Create the SecurityAuditLog table for tracking all security events
- Add proper foreign key constraints
- Create indexes for efficient queries (userId, event, action, severity, IP, timestamp)
- Enable comprehensive security monitoring and compliance

See `SECURITY_AUDIT_GUIDE.md` for complete implementation details.

## Content Scheduling

Add the following to your `prisma/schema.prisma` file:

### 1. Update Brief model

```prisma
model Brief {
  // ... existing fields ...

  // Add these fields:
  scheduledFor DateTime?
  publishedBy  String? // 'user' or 'scheduler'

  // Add this relation:
  scheduledPublication ScheduledPublication?

  // ... rest of existing relations ...

  @@index([scheduledFor])
}
```

### 2. Add ScheduledPublication model

```prisma
model ScheduledPublication {
  id             String    @id @default(cuid())
  briefId        String    @unique
  scheduledFor   DateTime
  status         String    @default("pending") // 'pending', 'published', 'failed', 'cancelled'
  attempts       Int       @default(0)
  lastAttemptAt  DateTime?
  errorMessage   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  brief Brief @relation(fields: [briefId], references: [id], onDelete: Cascade)

  @@index([scheduledFor])
  @@index([status])
  @@index([briefId])
}
```

### 3. Run migration

```bash
npx prisma migrate dev --name add_content_scheduling
npx prisma generate
```

## User Mentions

Add the following to your `prisma/schema.prisma` file:

### 1. Add Mention model

```prisma
model Mention {
  id              String   @id @default(cuid())
  mentionedUserId String
  mentionerId     String
  contentType     String // 'review', 'comment', 'brief'
  contentId       String
  content         String? // Snippet of text
  createdAt       DateTime @default(now())

  mentionedUser User @relation("UserMentions", fields: [mentionedUserId], references: [id], onDelete: Cascade)
  mentioner     User @relation("UserMentioning", fields: [mentionerId], references: [id], onDelete: Cascade)

  @@index([mentionedUserId])
  @@index([mentionerId])
  @@index([contentType])
  @@index([contentId])
  @@index([createdAt(sort: Desc)])
}
```

### 2. Update User model

```prisma
model User {
  // ... existing fields ...

  // Add these relations:
  mentions    Mention[] @relation("UserMentions")
  mentioning  Mention[] @relation("UserMentioning")

  // ... rest of existing relations ...
}
```

### 3. Run migration

```bash
npx prisma migrate dev --name add_user_mentions
npx prisma generate
```

---

All migrations are now complete! Run `npx prisma migrate dev` to apply all pending migrations.
