# Database Schema Documentation

This document describes the database schema for DeepScholar.

## Overview

DeepScholar uses PostgreSQL with Prisma ORM. The schema is defined in `prisma/schema.prisma`.

## Core Models

### User

Represents a user in the system.

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  isSeedData    Boolean   @default(false)
}
```

**Fields:**
- `id`: Unique identifier (CUID)
- `name`: User's display name
- `email`: User's email address (unique)
- `emailVerified`: Timestamp of email verification
- `image`: URL to user's profile image
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp
- `isSeedData`: Flag indicating if this is seed data

**Relations:**
- One-to-many: Briefs (authored briefs)
- One-to-many: Reviews
- One-to-many: BriefUpvotes
- One-to-many: SavedBriefs

**Indexes:**
- `email` (unique)

---

### Brief

Represents an AI research brief.

```prisma
model Brief {
  id              String    @id @default(cuid())
  title           String
  slug            String    @unique
  abstract        String?
  prompt          String    @db.Text
  response        String    @db.Text
  thinking        String?   @db.Text
  userId          String
  modelId         String
  isDraft         Boolean   @default(false)
  isActive        Boolean   @default(true)
  versionNumber   Int       @default(1)
  parentBriefId   String?
  changeLog       String?   @db.Text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  isSeedData      Boolean   @default(false)
}
```

**Fields:**
- `id`: Unique identifier
- `title`: Brief title
- `slug`: URL-friendly unique identifier
- `abstract`: Brief summary (optional)
- `prompt`: User's prompt/question
- `response`: AI's response
- `thinking`: AI's reasoning process (optional)
- `userId`: Author's user ID
- `modelId`: AI model used
- `isDraft`: Draft status flag
- `isActive`: Active version flag (for versioning)
- `versionNumber`: Version number
- `parentBriefId`: Parent brief ID (for versioning)
- `changeLog`: Version change description

**Relations:**
- Many-to-one: User (author)
- Many-to-one: Model
- Many-to-many: Categories
- One-to-many: Sources
- One-to-many: Reviews
- One-to-many: BriefUpvotes
- One-to-many: SavedBriefs
- One-to-many: BriefReferences (as source or target)
- Self-referential: Parent/child briefs (versioning)

**Indexes:**
- `slug` (unique)
- `userId` + `createdAt` (composite)
- `modelId`
- `parentBriefId`
- `isDraft` + `isActive`

---

### Category

Represents a category for organizing briefs.

```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?  # Hex color for UI
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  isSeedData  Boolean  @default(false)
}
```

**Fields:**
- `id`: Unique identifier
- `name`: Category name
- `slug`: URL-friendly identifier
- `description`: Category description (optional)
- `color`: Hex color code for UI (optional)

**Relations:**
- Many-to-many: Briefs

**Indexes:**
- `name` (unique)
- `slug` (unique)

---

### Model

Represents an AI model that can generate briefs.

```prisma
model Model {
  id          String   @id @default(cuid())
  name        String   @unique
  provider    String   # e.g., "OpenAI", "Anthropic", "Google"
  version     String?  # e.g., "gpt-4", "claude-3"
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  isSeedData  Boolean  @default(false)
}
```

**Fields:**
- `id`: Unique identifier
- `name`: Model display name
- `provider`: AI provider (OpenAI, Anthropic, etc.)
- `version`: Model version
- `description`: Model description

**Relations:**
- One-to-many: Briefs

**Indexes:**
- `name` (unique)

---

### Source

Represents a source/citation for a brief.

```prisma
model Source {
  id         String   @id @default(cuid())
  briefId    String
  title      String
  url        String?
  author     String?
  year       Int?
  type       String?  # "article", "book", "website", etc.
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  isSeedData Boolean  @default(false)
}
```

**Fields:**
- `id`: Unique identifier
- `briefId`: Associated brief ID
- `title`: Source title
- `url`: Source URL (optional)
- `author`: Source author (optional)
- `year`: Publication year (optional)
- `type`: Source type (article, book, website, etc.)
- `order`: Display order

**Relations:**
- Many-to-one: Brief

**Indexes:**
- `briefId`

---

### Review

Represents a user review of a brief.

```prisma
model Review {
  id         String   @id @default(cuid())
  briefId    String
  userId     String
  content    String   @db.Text
  rating     Int      # 1-5
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  isSeedData Boolean  @default(false)
}
```

**Fields:**
- `id`: Unique identifier
- `briefId`: Reviewed brief ID
- `userId`: Reviewer's user ID
- `content`: Review text
- `rating`: Rating (1-5 stars)

**Relations:**
- Many-to-one: Brief
- Many-to-one: User
- One-to-many: ReviewUpvotes
- One-to-many: ReviewHelpful

**Indexes:**
- `briefId` + `userId` (composite, unique)
- `briefId` + `createdAt`

**Constraints:**
- One review per user per brief

---

## Interaction Models

### BriefUpvote

Tracks upvotes on briefs.

```prisma
model BriefUpvote {
  id        String   @id @default(cuid())
  briefId   String
  userId    String
  createdAt DateTime @default(now())
}
```

**Indexes:**
- `briefId` + `userId` (composite, unique)

---

### SavedBrief

Tracks briefs saved by users.

```prisma
model SavedBrief {
  id        String   @id @default(cuid())
  briefId   String
  userId    String
  createdAt DateTime @default(now())
}
```

**Indexes:**
- `briefId` + `userId` (composite, unique)
- `userId` + `createdAt`

---

### BriefReference

Represents references between briefs (one brief citing another).

```prisma
model BriefReference {
  id             String   @id @default(cuid())
  sourceBriefId  String   # Brief that references
  targetBriefId  String   # Brief being referenced
  context        String?  # Optional context for reference
  createdAt      DateTime @default(now())
}
```

**Indexes:**
- `sourceBriefId` + `targetBriefId` (composite, unique)
- `targetBriefId`

---

## Junction Tables

### BriefCategory

Many-to-many relationship between Briefs and Categories.

```prisma
model BriefCategory {
  briefId    String
  categoryId String
  assignedAt DateTime @default(now())

  @@id([briefId, categoryId])
}
```

---

## Versioning System

Briefs support versioning through the `parentBriefId` field:

- **Original Brief**: `parentBriefId` is null, `versionNumber` is 1
- **New Version**: `parentBriefId` points to original, `versionNumber` increments
- **Active Version**: Only one version should have `isActive = true` at a time

**Version Workflow:**
1. User creates new version of brief
2. Previous versions set to `isActive = false`
3. New version created with `isActive = true` and incremented `versionNumber`

---

## Authentication Tables

### Account, Session, VerificationToken

These tables are managed by NextAuth.js for authentication:

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## Migrations

Migrations are located in `prisma/migrations/`.

### Running Migrations

```bash
# Development (creates migration file)
npx prisma migrate dev --name <migration_name>

# Production (applies migrations)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Rollback

See `scripts/rollback-migration.ts` for rollback procedures.

---

## Indexes and Performance

### Key Indexes

1. **User lookups**: `email` (unique)
2. **Brief queries**: `slug`, `userId + createdAt`, `modelId`
3. **Reviews**: `briefId + userId`, `briefId + createdAt`
4. **Interactions**: Composite unique indexes on all junction tables

### Query Optimization Tips

1. Use `include` sparingly - only fetch needed relations
2. Use `select` to limit returned fields
3. Leverage indexes for `where` clauses
4. Use pagination for large result sets

---

## Data Integrity

### Constraints

- Unique constraints on email, slug, category names
- Composite unique constraints on user-item relationships
- Foreign key constraints for all relations

### Cascading Deletes

Configured in Prisma schema with `onDelete` cascade for:
- Deleting a brief deletes its reviews, upvotes, saves, sources
- Deleting a user deletes their briefs (consider soft delete in production)

---

## Backup and Restore

See `scripts/backup-database.sh` and `scripts/restore-database.sh` for automated backup/restore procedures.

---

## Seeding

Seed data is marked with `isSeedData = true` for easy cleanup:

```bash
npm run db:seed      # Add seed data
npm run db:clear     # Remove seed data (where isSeedData = true)
```

---

## Future Enhancements

Planned schema additions:

1. **User Following**: User-to-user following relationships
2. **Notifications**: User notification system
3. **Comments**: Nested comments on briefs
4. **Tags**: Alternative to categories with many-to-many relationship
5. **Collections**: User-curated collections of briefs
6. **Analytics**: Brief view tracking and analytics

---

## Schema Diagram

```
User ─┬─ Brief ─┬─ Category
      │         ├─ Source
      │         ├─ Review ── ReviewUpvote
      │         ├─ BriefUpvote
      │         └─ BriefReference
      ├─ SavedBrief
      ├─ Account
      └─ Session

Model ── Brief
```

---

For the complete schema definition, see `prisma/schema.prisma`.
