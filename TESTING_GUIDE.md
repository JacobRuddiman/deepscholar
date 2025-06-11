# Testing Guide for Phase 1 Critical Fixes

This guide explains how to test all the Phase 1 critical issues that have been fixed in DeepScholar.

## 🔧 Setup for Testing

### Prerequisites
```bash
# Install dependencies
npm install

# Set up local mode for testing
echo "NEXT_PUBLIC_LOCAL_MODE=true" > .env.local
echo "DATABASE_URL=file:./dev.db" >> .env.local
echo "NEXTAUTH_SECRET=local-dev-secret" >> .env.local

# Apply database migrations and indexes
npx prisma db push
npx prisma generate

# Start the development server
npm run dev:local
```

## 1. 🔐 Authentication & Session Management Testing

### Test 1.1: Session Handling in Components
**What to test:** Components properly handle loading states and session persistence

**Steps:**
1. Open browser to `http://localhost:3000`
2. Navigate between pages (`/home`, `/briefs`, `/settings`)
3. Check browser console for errors
4. Refresh the page on any route
5. Verify user remains "logged in" in local mode

**Expected Results:**
- ✅ No console errors related to session handling
- ✅ Navigation works smoothly without loading issues
- ✅ Page refreshes maintain session state
- ✅ Local mode shows user as logged in consistently

**How to verify:**
```javascript
// Open browser console and check:
console.log('Session errors:', window.sessionErrors || 'None');
```

### Test 1.2: Error Boundary Functionality
**What to test:** Error boundaries catch and display errors properly

**Steps:**
1. Open browser dev tools
2. Navigate to any page
3. In console, trigger an error: `throw new Error('Test error')`
4. Check if error boundary displays
5. Click "Try Again" button
6. Click "Go Home" button

**Expected Results:**
- ✅ Error boundary displays with proper UI
- ✅ Error details shown in development mode
- ✅ "Try Again" button resets the error state
- ✅ "Go Home" button navigates to home page

### Test 1.3: Local Mode Session Persistence
**What to test:** Local mode maintains session across page refreshes

**Steps:**
1. Ensure `NEXT_PUBLIC_LOCAL_MODE=true` in `.env.local`
2. Start app with `npm run dev:local`
3. Navigate to `/profile` or `/settings`
4. Refresh the page multiple times
5. Check if user data persists

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ User data (name, email) displays consistently
- ✅ No authentication redirects in local mode

## 2. 💾 Database & Performance Testing

### Test 2.1: Database Query Performance
**What to test:** Database queries execute efficiently with proper indexes

**Steps:**
1. Open browser dev tools > Network tab
2. Navigate to `/briefs` page
3. Check response times for API calls
4. Look for multiple similar queries (N+1 problem)
5. Check database logs for slow queries

**Expected Results:**
- ✅ Page loads in under 2 seconds
- ✅ API responses under 500ms
- ✅ No duplicate queries for the same data
- ✅ Database indexes are being used

**How to verify:**
```bash
# Check if indexes were created
npx prisma studio
# Look at the database schema to verify indexes exist
```

### Test 2.2: Token Transaction Race Conditions
**What to test:** Concurrent token operations don't cause data corruption

**Steps:**
1. Open multiple browser tabs
2. Navigate to `/tokens` in each tab
3. Simultaneously click "Purchase" buttons in different tabs
4. Check token balance consistency
5. Look for database constraint errors in console

**Expected Results:**
- ✅ Token balance remains consistent
- ✅ No database constraint violations
- ✅ All transactions are properly recorded
- ✅ No negative token balances

### Test 2.3: Database Connection Handling
**What to test:** Database connections are properly managed

**Steps:**
1. Perform multiple operations rapidly:
   - Create briefs
   - Add reviews
   - Toggle upvotes
2. Check for connection timeout errors
3. Monitor database connection pool

**Expected Results:**
- ✅ No connection timeout errors
- ✅ Operations complete successfully
- ✅ Database connections are properly released

## 3. ✅ Error Handling & Validation Testing

### Test 3.1: Form Validation
**What to test:** All forms have proper validation and error feedback

**Steps:**
1. **Brief Creation Form** (`/brief_upload`):
   - Submit with empty URL
   - Submit with invalid URL
   - Submit with very long content
2. **Review Form** (on any brief page):
   - Submit empty review
   - Submit review with only 1 character
   - Submit review with 3000+ characters
3. **Settings Form** (`/settings`):
   - Enter invalid email format
   - Enter very long name

**Expected Results:**
- ✅ Proper error messages display
- ✅ Form prevents submission with invalid data
- ✅ Error messages are user-friendly
- ✅ Validation happens on both client and server

### Test 3.2: Error Popup Component
**What to test:** Error popup displays correctly for different error types

**Steps:**
1. Trigger network error (disconnect internet, try to submit form)
2. Trigger validation error (submit invalid data)
3. Trigger server error (modify form data in dev tools)
4. Check auto-close functionality
5. Check manual close functionality

**Expected Results:**
- ✅ Error popup appears for all error types
- ✅ Correct error messages display
- ✅ Auto-close works after 3 seconds
- ✅ Manual close button works
- ✅ Progress bar shows countdown

### Test 3.3: Input Sanitization
**What to test:** User input is properly sanitized to prevent XSS

**Steps:**
1. Try entering HTML/JavaScript in text fields:
   ```html
   <script>alert('XSS')</script>
   <img src="x" onerror="alert('XSS')">
   ```
2. Submit forms with this content
3. Check if scripts execute
4. Verify content is sanitized in database

**Expected Results:**
- ✅ No JavaScript execution from user input
- ✅ HTML tags are escaped or removed
- ✅ Content is safely stored and displayed
- ✅ No XSS vulnerabilities

## 4. 🔒 Security Testing

### Test 4.1: Rate Limiting
**What to test:** API endpoints are protected against abuse

**Steps:**
1. Open browser dev tools > Console
2. Run rapid API requests:
   ```javascript
   for(let i = 0; i < 150; i++) {
     fetch('/api/briefs').then(r => console.log(i, r.status));
   }
   ```
3. Check for 429 (Too Many Requests) responses
4. Wait 15 minutes and try again

**Expected Results:**
- ✅ Requests are throttled after 100 requests
- ✅ 429 status code returned for excess requests
- ✅ Rate limit resets after time window
- ✅ Normal requests work after reset

### Test 4.2: CSRF Protection
**What to test:** Forms are protected against CSRF attacks

**Steps:**
1. Open browser dev tools > Network tab
2. Submit any form (brief creation, review, etc.)
3. Check request headers for CSRF tokens
4. Try modifying form data in dev tools
5. Attempt to submit from external site

**Expected Results:**
- ✅ CSRF tokens present in requests
- ✅ Modified requests are rejected
- ✅ External form submissions fail
- ✅ Proper error messages for invalid tokens

### Test 4.3: Input Size Validation
**What to test:** Large payloads are rejected

**Steps:**
1. Try submitting very large content (>1MB)
2. Upload large files
3. Send requests with massive JSON payloads

**Expected Results:**
- ✅ Large requests are rejected
- ✅ Appropriate error messages shown
- ✅ Server doesn't crash or hang
- ✅ Memory usage remains stable

### Test 4.4: Security Headers
**What to test:** Proper security headers are set

**Steps:**
1. Open browser dev tools > Network tab
2. Navigate to any page
3. Check response headers for security headers
4. Verify CSP, XSS protection, etc.

**Expected Results:**
- ✅ `X-Frame-Options: DENY` header present
- ✅ `X-Content-Type-Options: nosniff` header present
- ✅ `X-XSS-Protection: 1; mode=block` header present
- ✅ `Referrer-Policy` header present

## 5. 🎯 Integration Testing

### Test 5.1: Complete User Flow
**What to test:** End-to-end user journey works properly

**Steps:**
1. Start from home page
2. Navigate to brief upload
3. Create a new brief
4. View the created brief
5. Add a review to another brief
6. Check token balance changes
7. Navigate to profile and settings

**Expected Results:**
- ✅ All navigation works smoothly
- ✅ Brief creation succeeds
- ✅ Reviews can be added
- ✅ Token transactions are recorded
- ✅ No errors in console

### Test 5.2: Error Recovery
**What to test:** Application recovers gracefully from errors

**Steps:**
1. Trigger various errors during user flow
2. Use error boundary "Try Again" functionality
3. Continue with normal operations
4. Check if application state is consistent

**Expected Results:**
- ✅ Errors don't break the entire application
- ✅ Error recovery works properly
- ✅ Application state remains consistent
- ✅ User can continue normal operations

## 6. 📱 Browser Compatibility Testing

### Test 6.1: Cross-Browser Testing
**What to test:** Application works in different browsers

**Browsers to test:**
- Chrome (latest)
- Firefox (latest)
- Safari (if on Mac)
- Edge (latest)

**Steps:**
1. Test basic navigation in each browser
2. Test form submissions
3. Test error handling
4. Check console for browser-specific errors

**Expected Results:**
- ✅ Consistent behavior across browsers
- ✅ No browser-specific JavaScript errors
- ✅ UI renders correctly in all browsers
- ✅ All features work as expected

## 7. 🔍 Performance Testing

### Test 7.1: Page Load Performance
**What to test:** Pages load quickly and efficiently

**Steps:**
1. Open browser dev tools > Performance tab
2. Record page load for different routes
3. Check Core Web Vitals
4. Analyze bundle sizes

**Expected Results:**
- ✅ First Contentful Paint < 2 seconds
- ✅ Largest Contentful Paint < 3 seconds
- ✅ Cumulative Layout Shift < 0.1
- ✅ JavaScript bundle size reasonable

### Test 7.2: Memory Usage
**What to test:** Application doesn't have memory leaks

**Steps:**
1. Open browser dev tools > Memory tab
2. Navigate between pages multiple times
3. Take heap snapshots
4. Check for memory growth

**Expected Results:**
- ✅ Memory usage remains stable
- ✅ No significant memory leaks
- ✅ Garbage collection works properly
- ✅ Performance doesn't degrade over time

## 8. 📊 Monitoring & Logging

### Test 8.1: Error Logging
**What to test:** Errors are properly logged for debugging

**Steps:**
1. Trigger various types of errors
2. Check browser console logs
3. Check server logs (if applicable)
4. Verify error details are captured

**Expected Results:**
- ✅ All errors are logged with details
- ✅ Stack traces are available in development
- ✅ Error context is preserved
- ✅ Logs are structured and searchable

## 🎯 Success Criteria

All tests should pass with the following criteria:

### Authentication & Session Management
- [ ] No session-related console errors
- [ ] Smooth navigation between pages
- [ ] Session persistence across refreshes
- [ ] Error boundaries work correctly

### Database & Performance
- [ ] Page loads under 2 seconds
- [ ] API responses under 500ms
- [ ] No N+1 query problems
- [ ] Token operations are atomic

### Error Handling & Validation
- [ ] All forms validate input properly
- [ ] Error messages are user-friendly
- [ ] Error popup works for all error types
- [ ] Input sanitization prevents XSS

### Security
- [ ] Rate limiting protects against abuse
- [ ] CSRF protection is active
- [ ] Security headers are present
- [ ] Large payloads are rejected

### Integration
- [ ] Complete user flows work end-to-end
- [ ] Error recovery maintains application state
- [ ] Cross-browser compatibility
- [ ] Performance meets standards

## 🚨 Common Issues & Solutions

### Issue: "Session not found" errors
**Solution:** Ensure `NEXT_PUBLIC_LOCAL_MODE=true` in `.env.local`

### Issue: Database connection errors
**Solution:** Run `npx prisma db push` to ensure database is set up

### Issue: Rate limiting in development
**Solution:** Wait 15 minutes or restart the server to reset rate limits

### Issue: TypeScript errors
**Solution:** Run `npx prisma generate` to regenerate Prisma client

### Issue: Performance issues
**Solution:** Check if database indexes were applied correctly

## 📝 Test Results Template

Use this template to record your test results:

```
## Test Results - [Date]

### Authentication & Session Management
- [ ] Session handling: PASS/FAIL
- [ ] Error boundaries: PASS/FAIL
- [ ] Local mode persistence: PASS/FAIL

### Database & Performance
- [ ] Query performance: PASS/FAIL
- [ ] Token transactions: PASS/FAIL
- [ ] Connection handling: PASS/FAIL

### Error Handling & Validation
- [ ] Form validation: PASS/FAIL
- [ ] Error popup: PASS/FAIL
- [ ] Input sanitization: PASS/FAIL

### Security
- [ ] Rate limiting: PASS/FAIL
- [ ] CSRF protection: PASS/FAIL
- [ ] Security headers: PASS/FAIL

### Integration
- [ ] User flows: PASS/FAIL
- [ ] Error recovery: PASS/FAIL
- [ ] Browser compatibility: PASS/FAIL

### Notes:
[Add any specific issues or observations]
```

This comprehensive testing guide ensures all Phase 1 critical fixes are working correctly and the application is stable and secure.
