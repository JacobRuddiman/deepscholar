# Notification System Guide

## Overview

DeepScholar includes a comprehensive notification system with in-app notifications and a framework for email notifications.

## Features Implemented

### 1. Database Schema

**Tables Created**:

#### Notification
- Stores individual notifications for users
- Types: follow, review, upvote, publish, mention, system
- Tracks read status and read timestamp
- Includes action URL for navigation
- Related ID for linking to entities

#### NotificationPreference
- User-specific notification preferences
- Separate settings for in-app and email
- Email digest settings (daily, weekly, monthly)
- Default preferences created automatically

### 2. Server Actions

**File**: `src/server/actions/notifications/notifications.ts`

**Functions**:
- `createNotification()` - Create a new notification
- `getUserNotifications()` - Get paginated notifications
- `markNotificationAsRead()` - Mark single notification as read
- `markAllNotificationsAsRead()` - Mark all as read
- `deleteNotification()` - Delete notification
- `getUnreadNotificationCount()` - Get count of unread
- `getNotificationPreferences()` - Get user preferences
- `updateNotificationPreferences()` - Update preferences

**Helper Functions**:
- `notifyNewFollower()` - Create notification for new follower
- `notifyNewReview()` - Create notification for new review
- `notifyNewUpvote()` - Create notification for new upvote

### 3. React Query Hooks

**File**: `src/hooks/mutations/useNotificationMutations.ts`

**Hooks**:
- `useNotifications()` - Query notifications with auto-refetch
- `useUnreadNotificationCount()` - Query unread count
- `useMarkNotificationAsRead()` - Mutation to mark as read
- `useMarkAllNotificationsAsRead()` - Mutation to mark all as read
- `useDeleteNotification()` - Mutation to delete
- `useNotificationPreferences()` - Query preferences
- `useUpdateNotificationPreferences()` - Mutation to update

**Features**:
- Automatic refetching (30s for notifications, 10s for count)
- Optimistic updates
- Automatic cache invalidation
- Error handling

### 4. UI Components

**File**: `src/components/notifications/NotificationBell.tsx`

**Component**: `NotificationBell`

**Features**:
- Bell icon with unread badge
- Dropdown notification panel
- Real-time unread count
- Mark all as read button
- Individual notification actions
- Delete notification button
- Time formatting (e.g., "5 minutes ago")
- Unread indicator (blue dot)
- Loading states
- Empty state
- Mobile responsive
- Full ARIA support

## Usage Guide

### 1. Add Notification Bell to Layout

```tsx
// app/layout.tsx or components/navigation/Header.tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header() {
  return (
    <header>
      {/* Other header content */}
      <NotificationBell />
    </header>
  );
}
```

### 2. Create Notifications

#### When User Follows Someone

```typescript
import { notifyNewFollower } from '@/server/actions/notifications/notifications';

// After creating follow relationship
await notifyNewFollower(followerId, followingId);
```

#### When User Reviews Brief

```typescript
import { notifyNewReview } from '@/server/actions/notifications/notifications';

// After creating review
await notifyNewReview(briefId, reviewerId, briefAuthorId);
```

#### When User Upvotes Brief

```typescript
import { notifyNewUpvote } from '@/server/actions/notifications/notifications';

// After creating upvote
await notifyNewUpvote(briefId, upvoterId, briefAuthorId);
```

#### Custom Notification

```typescript
import { createNotification } from '@/server/actions/notifications/notifications';

await createNotification({
  userId: 'user-id',
  type: 'system',
  title: 'Welcome!',
  message: 'Welcome to DeepScholar!',
  actionUrl: '/getting-started',
});
```

### 3. Notification Types

```typescript
type NotificationType =
  | 'follow'    // Someone followed you
  | 'review'    // Someone reviewed your brief
  | 'upvote'    // Someone upvoted your brief
  | 'publish'   // Your brief was published
  | 'mention'   // Someone mentioned you
  | 'system';   // System notification
```

### 4. Integrate with Existing Features

#### In Follow Action

```typescript
// src/server/actions/follow.ts
import { notifyNewFollower } from '@/server/actions/notifications/notifications';

export async function followUser(userIdToFollow: string) {
  // ... existing code ...

  const follow = await prisma.follow.create({
    data: { followerId: session.user.id, followingId: userIdToFollow }
  });

  // Send notification
  await notifyNewFollower(session.user.id, userIdToFollow);

  // ... rest of code ...
}
```

#### In Review Creation

```typescript
// When creating a review
import { notifyNewReview } from '@/server/actions/notifications/notifications';

export async function createReview(briefId: string, content: string) {
  // ... create review ...

  // Get brief author ID
  const brief = await prisma.brief.findUnique({
    where: { id: briefId },
    select: { userId: true },
  });

  if (brief) {
    await notifyNewReview(briefId, session.user.id, brief.userId);
  }
}
```

## Email Notifications

### Setup Email Service (Placeholder)

Email notifications require an email service provider. Common options:

1. **SendGrid** (Recommended)
2. **Mailgun**
3. **AWS SES**
4. **Postmark**
5. **Resend**

### Email Service Integration (Future)

```typescript
// src/lib/email.ts (to be created)
import nodemailer from 'nodemailer';

export async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string
) {
  // Configure with your email service
  const transporter = nodemailer.createTransporter({
    // ... config ...
  });

  await transporter.sendMail({
    from: 'notifications@deepscholar.com',
    to,
    subject,
    html: body,
  });
}
```

### Email Templates (Future)

Create HTML email templates for:
- New follower
- New review
- New upvote
- Weekly digest
- Brief published

### Digest Emails (Future)

```typescript
// src/server/cron/email-digest.ts (to be created)
export async function sendWeeklyDigest() {
  // Get all users with emailDigest enabled
  const users = await prisma.user.findMany({
    where: {
      notificationPreferences: {
        emailDigest: true,
        emailDigestFrequency: 'weekly',
      },
    },
    include: {
      notifications: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
  });

  for (const user of users) {
    // Send digest email
    await sendDigestEmail(user);
  }
}
```

## Notification Preferences

### Default Preferences

When a user is created, default preferences are:
- All in-app notifications: **enabled**
- Email follow/review/publish: **enabled**
- Email upvotes: **disabled**
- Email digest: **enabled** (weekly)

### Preference Management

Users can manage preferences at `/settings/notifications`:

```typescript
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/mutations/useNotificationMutations';

function NotificationSettings() {
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const handleToggle = (field: string, value: boolean) => {
    updatePreferences.mutate({ [field]: value });
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={preferences?.inAppNewFollow}
          onChange={(e) => handleToggle('inAppNewFollow', e.target.checked)}
        />
        New Followers (In-App)
      </label>
      {/* ... more preferences ... */}
    </div>
  );
}
```

## Real-Time Updates

### Auto-Refetch Strategy

- **Notification list**: Refetches every 30 seconds
- **Unread count**: Refetches every 10 seconds
- On user interaction: Immediate invalidation

### Optimistic Updates

When marking as read:
```typescript
const markAsRead = useMarkNotificationAsRead();

// Optimistically update UI
await markAsRead.mutateAsync(notificationId);
// Cache automatically invalidated and refetched
```

## Performance Optimizations

### Database Indexes

```sql
-- Fast lookup by user
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- Fast unread count
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- Fast chronological sorting
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);
```

### Query Optimization

- **Pagination**: Only fetch 10 notifications in dropdown
- **Conditional fetching**: Only fetch when dropdown is open
- **Count optimization**: Separate lightweight query for badge
- **Stale data**: Show cached data while refetching

## Accessibility

### ARIA Support

- `aria-label` on bell button with count
- `aria-expanded` for dropdown state
- `aria-haspopup="menu"` for dropdown
- `role="menu"` and `role="menuitem"`
- `aria-label` for all buttons
- `aria-hidden` for decorative icons
- Screen reader announcements for badge

### Keyboard Navigation

- Tab to bell button
- Enter/Space to open dropdown
- Tab through notifications
- Enter to activate notification
- Escape to close dropdown

## Security

### Authorization

All notification actions verify:
1. User is authenticated
2. User owns the notifications they're accessing
3. Notifications belong to requesting user

### Data Privacy

- Users only see their own notifications
- Cannot access other users' notifications
- Preferences are user-specific

## Testing

### Unit Tests (To Add)

```typescript
// __tests__/notifications.test.ts
describe('Notifications', () => {
  it('creates notification', async () => {
    const result = await createNotification({
      userId: 'user-1',
      type: 'follow',
      title: 'Test',
      message: 'Test message',
    });
    expect(result.success).toBe(true);
  });

  it('respects user preferences', async () => {
    // Disable in-app follow notifications
    await updateNotificationPreferences({
      userId: 'user-1',
      inAppNewFollow: false,
    });

    // Attempt to create follow notification
    const result = await createNotification({
      userId: 'user-1',
      type: 'follow',
      title: 'Test',
      message: 'Test',
    });

    // Should be silently skipped
    expect(result.data).toBeNull();
  });
});
```

### Integration Tests (To Add)

- Test notification creation flow
- Test mark as read
- Test delete
- Test preferences update

## Troubleshooting

### Notifications Not Appearing

1. Check user preferences
2. Verify notification was created in database
3. Check browser console for errors
4. Verify React Query cache

### Count Not Updating

1. Check refetch interval (10s)
2. Verify query invalidation
3. Check network tab for API calls

### Dropdown Not Opening

1. Check z-index conflicts
2. Verify component is client-side ('use client')
3. Check for JavaScript errors

## Future Enhancements

### Planned Features

1. **Push Notifications** (Web Push API)
2. **Email Service Integration**
3. **Digest Emails** (daily, weekly, monthly)
4. **Notification Grouping** (e.g., "5 people upvoted your brief")
5. **Rich Notifications** (with images, actions)
6. **Notification Sound** (optional)
7. **Mark as Unread**
8. **Notification Search/Filter**
9. **Archive Notifications**
10. **Desktop Notifications** (Electron app)

### Advanced Features

- Real-time notifications via WebSockets
- Notification templates system
- A/B testing for notification copy
- Analytics for notification engagement
- Smart notification timing
- Do Not Disturb hours

## Summary

The notification system is **fully implemented** for in-app notifications:

**Achievements**:
- ✅ Database schema
- ✅ Server actions with helpers
- ✅ React Query hooks
- ✅ Notification bell UI
- ✅ Auto-refetching
- ✅ Preference management
- ✅ Full ARIA support
- ✅ Mobile responsive
- ⚠️ Email service (placeholder - requires API keys)

**Ready for**:
- Immediate use
- Integration with existing features
- Email service integration (when API keys available)
- Push notifications
- Advanced features

---

**Last Updated**: December 29, 2025
**Status**: Production Ready (In-App)
**Email Status**: Framework Ready (Requires Service Integration)
