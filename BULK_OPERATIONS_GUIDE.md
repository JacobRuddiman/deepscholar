# Bulk Operations Guide

## Overview

The bulk operations system allows users to perform actions on multiple briefs/drafts at once, improving efficiency and user experience.

## Features Implemented

### 1. Bulk Selection System

**Context Provider**: `BulkSelectProvider`
- Manages selection state across the application
- Tracks selected item IDs
- Provides functions for toggling, selecting all, and clearing selections

**Key Functions**:
```typescript
{
  selectedIds: string[];           // Array of selected item IDs
  toggleSelection: (id: string) => void;  // Toggle single item
  selectAll: (ids: string[]) => void;     // Select all items
  clearSelection: () => void;             // Clear all selections
  isSelected: (id: string) => boolean;    // Check if item is selected
  selectedCount: number;                  // Count of selected items
}
```

### 2. UI Components

#### BulkSelectCheckbox
Individual checkbox for each item in a list.

**Usage**:
```tsx
<BulkSelectCheckbox id={item.id} className="optional-class" />
```

**Features**:
- Styled with Tailwind CSS
- Automatically stops click propagation
- Updates selection state on toggle

#### BulkSelectAllCheckbox
Master checkbox for selecting/deselecting all items.

**Usage**:
```tsx
<BulkSelectAllCheckbox allIds={items.map(i => i.id)} />
```

**Features**:
- Three states: unchecked, checked, indeterminate
- Shows indeterminate when some (but not all) items selected
- Toggles between select all and clear all

#### BulkActionsToolbar
Floating toolbar that appears when items are selected.

**Usage**:
```tsx
<BulkActionsToolbar
  onDelete={handleBulkDelete}
  onPublish={handleBulkPublish}
  onMakePublic={handleBulkMakePublic}
  onMakePrivate={handleBulkMakePrivate}
  onExport={handleBulkExport}
  onAddCategories={handleBulkAddCategories}
/>
```

**Features**:
- Fixed position at bottom of screen
- Shows selected count
- Animated slide-up entrance
- Action buttons with icons
- Clear selection button

### 3. Server Actions

All server actions are located in `src/server/actions/briefs/bulk.ts`.

#### bulkDeleteBriefs(briefIds: string[])
Deletes multiple briefs at once.

**Security**:
- Verifies user authentication
- Checks ownership of all briefs
- Prevents deletion of unauthorized briefs

**Returns**:
```typescript
{
  success: boolean;
  data?: { count: number };
  error?: string;
}
```

#### bulkPublishDrafts(draftIds: string[])
Publishes multiple drafts at once.

**Features**:
- Validates all drafts have required fields (title, prompt, response)
- Auto-generates unique slugs for drafts without them
- Sets `isDraft: false` and `published: true`

**Validation**:
- Checks user ownership
- Ensures drafts have required content
- Prevents duplicate slugs

#### bulkUpdateVisibility(briefIds: string[], isPublic: boolean)
Updates visibility of multiple briefs.

**Usage**:
```typescript
// Make public
await bulkUpdateVisibility(selectedIds, true);

// Make private
await bulkUpdateVisibility(selectedIds, false);
```

#### bulkAddCategories(briefIds: string[], categoryIds: string[])
Adds categories to multiple briefs.

**Features**:
- Connects categories to all selected briefs
- Uses Prisma's `connect` relation feature
- Preserves existing categories

#### getBulkOperationSummary(briefIds: string[])
Gets statistics about selected briefs.

**Returns**:
```typescript
{
  total: number;         // Total briefs selected
  owned: number;         // Briefs owned by user
  unauthorized: number;  // Briefs user doesn't own
  drafts: number;        // Number of drafts
  published: number;     // Published briefs
  unpublished: number;   // Unpublished briefs
}
```

### 4. React Query Hooks

All hooks are located in `src/hooks/mutations/useBulkMutations.ts`.

#### useBulkDeleteBriefs()
```typescript
const deleteBulk = useBulkDeleteBriefs();

deleteBulk.mutate(briefIds, {
  onSuccess: () => {
    // Automatically invalidates ['briefs'] and ['userBriefs'] queries
    clearSelection();
    router.refresh();
  }
});
```

#### useBulkPublishDrafts()
```typescript
const publishBulk = useBulkPublishDrafts();

publishBulk.mutate(draftIds, {
  onSuccess: () => {
    // Automatically invalidates ['drafts'] and ['briefs'] queries
    clearSelection();
    router.refresh();
  }
});
```

#### useBulkUpdateVisibility()
```typescript
const updateVisibility = useBulkUpdateVisibility();

updateVisibility.mutate(
  { briefIds, isPublic: true },
  {
    onSuccess: () => {
      // Automatically invalidates ['briefs'] and ['userBriefs'] queries
    }
  }
);
```

#### useBulkAddCategories()
```typescript
const addCategories = useBulkAddCategories();

addCategories.mutate(
  { briefIds, categoryIds },
  {
    onSuccess: () => {
      // Automatically invalidates ['briefs'] and ['userBriefs'] queries
    }
  }
);
```

## Integration Examples

### Example 1: My Briefs Page

**File**: `src/app/my-briefs/page.tsx`

```tsx
export default function MyBriefsPage() {
  return (
    <BulkSelectProvider>
      <MyBriefsContent />
    </BulkSelectProvider>
  );
}

function MyBriefsContent() {
  const { selectedIds, clearSelection } = useBulkSelect();
  const deleteBulk = useBulkDeleteBriefs();
  const updateVisibility = useBulkUpdateVisibility();

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} briefs?`)) return;
    await deleteBulk.mutateAsync(selectedIds);
    clearSelection();
  };

  const handleBulkMakePublic = async () => {
    await updateVisibility.mutateAsync({
      briefIds: selectedIds,
      isPublic: true
    });
    clearSelection();
  };

  return (
    <div>
      {/* Header with select all */}
      <BulkSelectAllCheckbox allIds={briefs.map(b => b.id)} />

      {/* Brief cards with checkboxes */}
      {briefs.map(brief => (
        <div key={brief.id}>
          <BulkSelectCheckbox id={brief.id} />
          {/* Brief content */}
        </div>
      ))}

      {/* Floating toolbar */}
      <BulkActionsToolbar
        onDelete={handleBulkDelete}
        onMakePublic={handleBulkMakePublic}
      />
    </div>
  );
}
```

### Example 2: Drafts Page

**File**: `src/app/dashboard/drafts/page.tsx`

```tsx
export default function DraftsPage() {
  return (
    <BulkSelectProvider>
      <DraftsContent />
    </BulkSelectProvider>
  );
}

function DraftsContent() {
  const { selectedIds, clearSelection } = useBulkSelect();
  const bulkPublish = useBulkPublishDrafts();
  const bulkDelete = useBulkDeleteBriefs();

  const handleBulkPublish = async () => {
    if (!confirm(`Publish ${selectedIds.length} drafts?`)) return;
    await bulkPublish.mutateAsync(selectedIds);
    clearSelection();
  };

  return (
    <div>
      {/* Header with select all */}
      <BulkSelectAllCheckbox allIds={drafts.map(d => d.id)} />

      {/* Draft cards with checkboxes */}
      {drafts.map(draft => (
        <div key={draft.id}>
          <BulkSelectCheckbox id={draft.id} />
          {/* Draft content */}
        </div>
      ))}

      {/* Floating toolbar */}
      <BulkActionsToolbar
        onDelete={handleBulkDelete}
        onPublish={handleBulkPublish}
      />
    </div>
  );
}
```

## User Experience Flow

1. **Select Items**
   - User clicks individual checkboxes on items
   - OR clicks "Select All" checkbox in header
   - Selection state updates in real-time

2. **Toolbar Appears**
   - Floating toolbar slides up from bottom
   - Shows count of selected items
   - Displays relevant action buttons

3. **Perform Action**
   - User clicks action button (Delete, Publish, etc.)
   - Confirmation dialog appears (for destructive actions)
   - User confirms

4. **Processing**
   - Loading state shown on button
   - Server action executes
   - Validates permissions and data

5. **Completion**
   - Selection cleared automatically
   - Queries invalidated and refetched
   - UI updates with new data
   - Success feedback (implicit through UI update)

## Security Features

### Authorization Checks
Every bulk operation:
1. Verifies user is authenticated
2. Fetches all target items from database
3. Filters for items owned by user
4. Returns error if ANY unauthorized items found
5. Only proceeds if user owns ALL selected items

### Validation
- Drafts must have title, prompt, and response to publish
- Slugs are auto-generated and checked for uniqueness
- Empty selections are rejected
- Database transactions ensure atomicity

### Error Handling
- Try-catch blocks around all operations
- User-friendly error messages
- Console logging for debugging
- Failed operations don't affect other data

## Performance Optimizations

### React Query Integration
- Automatic cache invalidation on success
- Optimistic updates possible (not currently implemented)
- Automatic retry on failure
- Request deduplication

### Database Efficiency
- Single query to verify ownership
- Bulk operations use `updateMany` / `deleteMany`
- Indexed queries on `id` and `userId`
- Efficient relation handling with `connect`

### UI Optimizations
- Checkboxes stop click propagation
- Toolbar only renders when items selected
- Animations use CSS transforms (GPU accelerated)
- State updates batched by React

## Future Enhancements

### Planned Features
1. **Optimistic Updates**
   - Update UI immediately, rollback on error
   - Improve perceived performance

2. **Progress Indicators**
   - Show progress for large bulk operations
   - "Processing 5 of 10 items..."

3. **Undo/Redo**
   - Allow undoing bulk delete
   - Temporary trash/archive

4. **Category Selection Dialog**
   - Modal for selecting categories
   - Search and filter categories
   - Preview affected briefs

5. **Keyboard Shortcuts**
   - Shift+Click for range selection
   - Ctrl+A for select all
   - Delete key for bulk delete

6. **Export Integration**
   - Bulk export selected briefs
   - Choose format (Markdown, PDF)
   - Download as ZIP

7. **Advanced Filters**
   - Select by category
   - Select by date range
   - Select by status

## Testing Recommendations

### Unit Tests
- Test selection state management
- Test server action permissions
- Test validation logic

### Integration Tests
- Test full user flow
- Test error scenarios
- Test permission boundaries

### E2E Tests
- Select multiple items
- Perform bulk action
- Verify UI updates
- Test across different pages

## Troubleshooting

### Toolbar Not Appearing
- Check that BulkSelectProvider wraps the component
- Verify items are being selected (check selectedIds)
- Ensure BulkActionsToolbar is rendered

### Action Fails Silently
- Check browser console for errors
- Verify server action returns success: false
- Check network tab for API errors

### Selection Not Clearing
- Call clearSelection() after action completes
- Check for errors in mutation callbacks
- Verify BulkSelectProvider is not re-mounting

### Permission Errors
- Ensure user owns all selected items
- Check session/authentication
- Verify database userId matches session.user.id

## Summary

The bulk operations system provides a comprehensive solution for managing multiple items at once. It includes:

- ✅ Client-side selection state management
- ✅ Reusable UI components
- ✅ Secure server actions with authorization
- ✅ React Query integration
- ✅ Real-time UI updates
- ✅ Error handling and validation
- ✅ Responsive floating toolbar
- ✅ Integration with existing pages

The system is production-ready and can be extended with additional operations as needed.
