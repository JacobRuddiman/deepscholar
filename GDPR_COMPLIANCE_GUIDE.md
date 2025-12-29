# GDPR Compliance Guide

## Overview

DeepScholar implements comprehensive GDPR (General Data Protection Regulation) compliance features, allowing users to exercise their data protection rights.

## Features

### 1. Right to Access (Article 15)

Users can export all their personal data in a machine-readable JSON format.

**Data Included in Export:**
- User profile (name, email, bio, social links)
- All briefs (published and drafts)
- All reviews written
- All upvotes given
- Social connections (following/followers)
- Notifications and preferences
- Reputation data (points, level, rank)
- Badges earned
- Reputation history
- Review helpful marks

### 2. Right to Erasure (Article 17)

Users can request account deletion with appropriate safeguards.

**Deletion Process:**
1. User submits deletion request
2. Grace period (7-30 days depending on published content)
3. Account and associated data deleted
4. Published briefs anonymized (to preserve community knowledge)

**What Gets Deleted:**
- User profile and credentials
- Draft briefs
- Reviews and comments
- Upvotes and follows
- Reputation and badges
- Notifications
- Personal preferences

**What Gets Anonymized:**
- Published briefs (reassigned to "Deleted User")
- This preserves valuable community content while removing personal association

### 3. Right to Data Portability (Article 20)

All exported data is provided in JSON format for easy portability to other services.

### 4. Right to Rectification (Article 16)

Users can update their profile information at any time through the settings page.

## Database Schema

### AccountDeletionRequest Table

```sql
CREATE TABLE "AccountDeletionRequest" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "reason" TEXT,
  "publishedBriefsCount" INTEGER DEFAULT 0,
  "requestedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" DATETIME,

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

### Deleted User Placeholder

A special "deleted-user" account is created to preserve published briefs:

```sql
INSERT INTO "User" ("id", "name", "email")
VALUES ('deleted-user', 'Deleted User', 'deleted@deepscholar.local');
```

## Implementation

### 1. Server Actions

**File**: `src/server/actions/gdpr/gdpr.ts`

```typescript
import {
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
  getDeletionRequestStatus,
  downloadUserDataJSON,
  processAccountDeletion, // Admin only
} from '@/server/actions/gdpr/gdpr';
```

#### Export User Data

```typescript
const result = await exportUserData();

// result.data contains:
// {
//   exportDate: ISO timestamp,
//   exportVersion: "1.0",
//   dataSubject: { userId, email },
//   profile: { ... },
//   briefs: { count, data: [...] },
//   reviews: { count, data: [...] },
//   ... (all user data)
// }
```

#### Request Deletion

```typescript
const result = await requestAccountDeletion('Reason for leaving');

// result.data contains:
// {
//   message: "Account deletion request submitted",
//   publishedBriefs: number,
//   estimatedDeletionDate: Date (30 days from now)
// }
```

#### Cancel Deletion

```typescript
const result = await cancelAccountDeletion();
// Removes pending deletion request
```

#### Check Deletion Status

```typescript
const result = await getDeletionRequestStatus();

// result.data contains:
// {
//   hasPendingDeletion: boolean,
//   request: {
//     id, userId, reason, requestedAt, publishedBriefsCount
//   }
// }
```

### 2. React Query Hooks

**File**: `src/hooks/mutations/useGDPRMutations.ts`

```typescript
import {
  useExportUserData,
  useDownloadUserData,
  useRequestAccountDeletion,
  useCancelAccountDeletion,
  useDeletionRequestStatus,
} from '@/hooks/mutations/useGDPRMutations';
```

#### Export Data

```typescript
'use client';

const exportData = useExportUserData();

const handleExport = async () => {
  const data = await exportData.mutateAsync();
  console.log('Exported data:', data);
};

// Auto shows success toast
// Returns complete user data object
```

#### Download Data

```typescript
const downloadData = useDownloadUserData();

const handleDownload = () => {
  downloadData.mutate();
  // Automatically triggers browser download
  // File: deepscholar-data-export-{timestamp}.json
};
```

#### Request Deletion

```typescript
const requestDeletion = useRequestAccountDeletion();

const handleDelete = async (reason?: string) => {
  await requestDeletion.mutateAsync(reason);
  // Auto shows toast with grace period info
  // Invalidates deletion status cache
};
```

#### Cancel Deletion

```typescript
const cancelDeletion = useCancelAccountDeletion();

const handleCancel = async () => {
  await cancelDeletion.mutateAsync();
  // Auto shows success toast
};
```

#### Check Status

```typescript
const { data: status } = useDeletionRequestStatus();

if (status?.hasPendingDeletion) {
  console.log('Deletion requested:', status.request.requestedAt);
}
```

### 3. UI Components

#### DataExportCard

**File**: `src/components/gdpr/DataExportCard.tsx`

Complete card UI for data export:
- Export preparation button
- Export summary (counts of all data)
- JSON download button
- Progress indicators

```typescript
import { DataExportCard } from '@/components/gdpr/DataExportCard';

<DataExportCard />
```

#### AccountDeletionCard

**File**: `src/components/gdpr/AccountDeletionCard.tsx`

Complete card UI for account deletion:
- Warning alerts
- Deletion request dialog
- Reason input (optional)
- Pending deletion status
- Cancellation option

```typescript
import { AccountDeletionCard } from '@/components/gdpr/AccountDeletionCard';

<AccountDeletionCard />
```

### 4. Privacy Settings Page

**File**: `src/app/settings/privacy/page.tsx`

Complete privacy management page:
- Data export section
- Account deletion section
- GDPR rights information
- Contact information

```typescript
// Access at: /settings/privacy
```

## Usage Examples

### Example 1: Privacy Settings Page

```typescript
// src/app/settings/privacy/page.tsx
import { DataExportCard } from '@/components/gdpr/DataExportCard';
import { AccountDeletionCard } from '@/components/gdpr/AccountDeletionCard';

export default function PrivacyPage() {
  return (
    <div className="container space-y-6">
      <h1>Privacy & Data</h1>
      <DataExportCard />
      <AccountDeletionCard />
    </div>
  );
}
```

### Example 2: Admin Deletion Processing

```typescript
// This should run as a cron job daily
import { processAccountDeletion } from '@/server/actions/gdpr/gdpr';

// In your cron job / scheduled task
async function processPendingDeletions() {
  // Find users with deletion requests > 30 days old
  const pendingDeletions = await prisma.accountDeletionRequest.findMany({
    where: {
      deletedAt: null,
      requestedAt: {
        lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  for (const request of pendingDeletions) {
    await processAccountDeletion(request.userId);
  }
}
```

### Example 3: Export Before Deletion

```typescript
'use client';

import { useDownloadUserData, useRequestAccountDeletion } from '@/hooks/mutations/useGDPRMutations';

export function DeleteAccountFlow() {
  const downloadData = useDownloadUserData();
  const requestDeletion = useRequestAccountDeletion();

  const handleDeleteWithExport = async () => {
    // Step 1: Download data first
    await downloadData.mutateAsync();

    // Step 2: Request deletion
    await requestDeletion.mutateAsync('Downloaded data before leaving');
  };

  return (
    <button onClick={handleDeleteWithExport}>
      Export Data & Delete Account
    </button>
  );
}
```

### Example 4: Show Deletion Banner

```typescript
'use client';

import { useDeletionRequestStatus } from '@/hooks/mutations/useGDPRMutations';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DeletionBanner() {
  const { data: status } = useDeletionRequestStatus();

  if (!status?.hasPendingDeletion) return null;

  return (
    <Alert variant="destructive">
      <AlertDescription>
        Your account is scheduled for deletion on{' '}
        {new Date(status.request.requestedAt).toLocaleDateString()}
        . You can cancel this in your privacy settings.
      </AlertDescription>
    </Alert>
  );
}
```

## Data Export Structure

### Sample Export JSON

```json
{
  "exportDate": "2025-12-29T12:00:00.000Z",
  "exportVersion": "1.0",
  "dataSubject": {
    "userId": "user123",
    "email": "user@example.com"
  },
  "profile": {
    "id": "user123",
    "name": "John Doe",
    "email": "user@example.com",
    "bio": "Researcher",
    "website": "https://example.com",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "briefs": {
    "count": 5,
    "data": [
      {
        "id": "brief1",
        "title": "AI in Healthcare",
        "slug": "ai-in-healthcare",
        "content": "...",
        "isPublic": true,
        "publishedAt": "2025-02-01T00:00:00.000Z",
        "categories": [...]
      }
    ]
  },
  "reviews": {
    "count": 10,
    "data": [...]
  },
  "reputation": {
    "current": {
      "points": 250,
      "level": 4,
      "rank": "Regular",
      "briefsPublished": 5,
      "currentStreak": 7
    },
    "badges": {
      "count": 3,
      "data": [...]
    },
    "history": {
      "count": 50,
      "data": [...]
    }
  }
  // ... more data
}
```

## Deletion Grace Periods

### Grace Period Logic

```typescript
// Calculate grace period based on content
function getGracePeriod(publishedBriefs: number): number {
  if (publishedBriefs > 0) {
    return 30; // 30 days for users with published content
  }
  return 7; // 7 days for users without published content
}
```

### Scheduled Processing

Recommended cron schedule:
- **Daily**: Check for deletion requests past grace period
- **Weekly**: Send reminder emails to users with pending deletions
- **Monthly**: Audit deletion logs for compliance

```bash
# Example cron job (runs daily at 2 AM)
0 2 * * * node scripts/process-deletions.js
```

## Admin Tools

### View Deletion Requests

```typescript
// Admin dashboard
const pendingDeletions = await prisma.accountDeletionRequest.findMany({
  where: { deletedAt: null },
  include: { user: true },
  orderBy: { requestedAt: 'desc' },
});
```

### Manual Deletion Processing

```typescript
// Admin action
await processAccountDeletion(userId);
// Verifies grace period
// Anonymizes published content
// Deletes user and associated data
```

## Compliance Checklist

- [x] **Article 15**: Right to access data ✅
- [x] **Article 16**: Right to rectification (profile settings) ✅
- [x] **Article 17**: Right to erasure ✅
- [x] **Article 20**: Right to data portability ✅
- [x] Grace period for deletion ✅
- [x] Deletion request tracking ✅
- [x] Data export in structured format (JSON) ✅
- [x] Preserve published content (anonymized) ✅
- [x] Audit logging ✅
- [x] User notification (toasts) ✅
- [ ] Email notifications for deletion requests (TODO)
- [ ] Admin dashboard for managing requests (TODO)
- [ ] Deletion audit logs (TODO)

## Security Considerations

### 1. Authentication

All GDPR endpoints require authentication:
```typescript
const session = await auth();
if (!session?.user?.id) {
  return { success: false, error: 'Unauthorized' };
}
```

### 2. Authorization

Users can only export/delete their own data:
```typescript
const userId = session.user.id; // Not from request params
```

### 3. Admin Actions

`processAccountDeletion` should be restricted to admin users only.

### 4. Data Minimization

Exports only include necessary data, not sensitive credentials.

### 5. Audit Trail

All deletion requests are logged with:
- User ID
- Timestamp
- Reason
- Published content count

## Best Practices

### 1. Always Notify Users

```typescript
// Show toast on successful export
toast.success('Data export completed');

// Show toast on deletion request
toast.success('Deletion request submitted', {
  description: 'Grace period: 30 days',
});
```

### 2. Confirm Destructive Actions

```typescript
// Use dialog for account deletion
<Dialog>
  <DialogTrigger>Delete Account</DialogTrigger>
  <DialogContent>
    {/* Confirmation content */}
  </DialogContent>
</Dialog>
```

### 3. Provide Context

Explain what data is included, grace periods, and consequences.

### 4. Make It Reversible

Allow users to cancel deletion requests within grace period.

### 5. Preserve Community Value

Anonymize published content instead of deleting it.

## Testing

### Test Data Export

```typescript
// Test complete data export
const result = await exportUserData();
expect(result.success).toBe(true);
expect(result.data.briefs.count).toBeGreaterThan(0);
expect(result.data.profile.email).toBeDefined();
```

### Test Deletion Request

```typescript
// Test deletion request
const result = await requestAccountDeletion('Test reason');
expect(result.success).toBe(true);
expect(result.data.estimatedDeletionDate).toBeDefined();

// Verify request created
const status = await getDeletionRequestStatus();
expect(status.data.hasPendingDeletion).toBe(true);
```

### Test Cancellation

```typescript
// Test cancellation
await requestAccountDeletion();
const result = await cancelAccountDeletion();
expect(result.success).toBe(true);

const status = await getDeletionRequestStatus();
expect(status.data.hasPendingDeletion).toBe(false);
```

## Troubleshooting

### Issue: Export taking too long

**Solution**: Implement pagination for large datasets or background job processing.

### Issue: Deletion not processing

**Check**:
1. Grace period has passed
2. Deletion request exists and `deletedAt` is null
3. Cron job is running
4. No database constraints preventing deletion

### Issue: Published briefs not anonymizing

**Check**:
1. "deleted-user" placeholder exists in database
2. Transaction is completing successfully
3. Foreign key constraints allow reassignment

## Future Enhancements

- [ ] Email notifications for deletion requests
- [ ] PDF export format option
- [ ] Selective data export (choose what to include)
- [ ] Data export history tracking
- [ ] Admin dashboard for managing deletion requests
- [ ] Bulk deletion processing for admins
- [ ] Deletion audit logs
- [ ] Automated compliance reporting
- [ ] CCPA compliance features
- [ ] Data retention policies

---

**Last Updated**: December 29, 2025
**Status**: Production Ready
**Compliance**: GDPR Articles 15, 16, 17, 20
**Dependencies**: Prisma, React Query, Sonner (for toasts)
