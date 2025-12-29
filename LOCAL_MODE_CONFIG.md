# Local Mode Configuration

DeepScholar now supports **independent local mode flags** for flexible development configurations.

## Environment Variables

### `.env` Configuration

```env
# LOCAL_AUTH: Bypass authentication (use demo user instead of OAuth)
NEXT_PUBLIC_LOCAL_AUTH=true

# LOCAL_DB: Use local SQLite database instead of remote PostgreSQL
NEXT_PUBLIC_LOCAL_DB=false
```

## Available Configurations

### 1. **Local Auth + Remote Database** (Current Setup)
```env
NEXT_PUBLIC_LOCAL_AUTH=true
NEXT_PUBLIC_LOCAL_DB=false
DATABASE_URL="postgres://..."
```
- ✅ No OAuth login required (uses demo user)
- ✅ Connects to PostgreSQL database
- **Use case**: Development with real database data

### 2. **Local Auth + Local Database**
```env
NEXT_PUBLIC_LOCAL_AUTH=true
NEXT_PUBLIC_LOCAL_DB=true
DATABASE_URL="file:./dev.db"
```
- ✅ No OAuth login required (uses demo user)
- ✅ Uses SQLite local database
- **Use case**: Offline development, no internet needed

### 3. **Production Auth + Remote Database**
```env
NEXT_PUBLIC_LOCAL_AUTH=false
NEXT_PUBLIC_LOCAL_DB=false
DATABASE_URL="postgres://..."
```
- ✅ OAuth login required (Google, Discord)
- ✅ Connects to PostgreSQL database
- **Use case**: Production or staging environment

### 4. **Production Auth + Local Database** (Rare)
```env
NEXT_PUBLIC_LOCAL_AUTH=false
NEXT_PUBLIC_LOCAL_DB=true
DATABASE_URL="file:./dev.db"
```
- ✅ OAuth login required
- ✅ Uses SQLite local database
- **Use case**: Testing auth with local data

## Helper Functions

### Updated Imports

```typescript
import {
  isLocalAuth,    // Check if using local authentication
  isLocalDb,      // Check if using local database
  isLocalMode,    // true if EITHER flag is true (backward compatibility)
  LOCAL_USER,     // Demo user object
  getLocalUser,   // Get local user (null if not in local auth)
  getLocalSession // Get local session (null if not in local auth)
} from '@/lib/localMode';
```

### Usage Examples

```typescript
// Authentication checks (use LOCAL_AUTH)
async function getUserId() {
  if (isLocalAuth()) {
    return LOCAL_USER.id;
  }
  const session = await auth();
  return session.user.id;
}

// Database selection (use LOCAL_DB)
const db = isLocalDb()
  ? new PrismaClient({ datasources: { db: { url: "file:./dev.db" } } })
  : new PrismaClient();

// General dev utilities (use LOCAL_MODE)
if (isLocalMode()) {
  // Available in development when either flag is true
  console.log('Development mode utilities enabled');
}
```

## Files Updated

### Core Configuration
- ✅ `src/lib/localMode.ts` - Added separate flags and helpers
- ✅ `src/server/db.ts` - Uses `isLocalDb()` for database selection
- ✅ `src/server/auth/config.ts` - Uses `isLocalAuth()` for authentication

### Server Actions
- ✅ `src/server/actions/briefs/utils.ts` - `getUserId()` uses `isLocalAuth()`
- ✅ `src/server/actions/tokens.ts` - `getUserId()` uses `isLocalAuth()`
- ✅ `src/server/actions/admin.ts` - Admin checks use `isLocalAuth()`

### API Routes
- ✅ `src/app/api/recommendations/personalized/route.ts` - Uses `isLocalAuth()`

## Migration Guide

### From Old System
```diff
- NEXT_PUBLIC_LOCAL_MODE=true
+ NEXT_PUBLIC_LOCAL_AUTH=true
+ NEXT_PUBLIC_LOCAL_DB=false
```

### Prisma Schema Considerations

When `LOCAL_DB=true` (SQLite):
- Schema must use `provider = "sqlite"`
- Run `npx prisma generate` after switching

When `LOCAL_DB=false` (PostgreSQL):
- Schema must use `provider = "postgresql"`
- Use direct connection (port 5432) for migrations
- Use pooled connection (port 6543) for runtime

### Switching Databases

**To PostgreSQL:**
1. Set `NEXT_PUBLIC_LOCAL_DB=false`
2. Update `DATABASE_URL` to PostgreSQL connection
3. Run `npx prisma db push` (with direct connection)
4. Restart dev server

**To SQLite:**
1. Set `NEXT_PUBLIC_LOCAL_DB=true`
2. Update schema.prisma `provider = "sqlite"`
3. Run `npx prisma generate`
4. Run `npx prisma db push`
5. Restart dev server

## Benefits

✨ **Flexibility**: Mix and match auth/database modes
✨ **Development Speed**: Skip OAuth during development
✨ **Testing**: Test real database with mock auth
✨ **Offline Work**: Full local development when needed
✨ **Production Ready**: Easy switch to production config

## Backward Compatibility

The `isLocalMode()` function still exists and returns `true` when **either** `LOCAL_AUTH` or `LOCAL_DB` is enabled. This ensures existing code continues to work while you migrate to the new specific flags.
