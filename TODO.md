# DeepScholar — TODO

## Actionable

### Features
- [x] **API documentation** — reference doc at `src/app/api/v1/README.md`
- [x] **Notification model** — add to Prisma schema (`prisma.notification` used in notifications.ts, mentions.ts, useNotificationMutations — crashes at runtime without it)
- [ ] **Collaborative briefs** — multiple authors on a single brief
- [x] **Automatic tagging** — ensemble voting auto-tagger with editable UI in upload editor

### UI/UX
- [ ] **Improve brief reading experience** — better typography, spacing, and content width
- [x] **Better empty states** — actionable suggestions instead of just "nothing here"
- [x] **Drag-and-drop file uploads** — enhance the FileDropzone component
- [ ] **Mobile pull-to-refresh** — native-feeling gesture for brief lists

### Infrastructure
- [ ] **Sentry integration** — error monitoring (infrastructure ready, needs service config)
- [ ] **Email service** — SendGrid/Mailgun for notifications (infrastructure ready, needs config)
- [ ] **Automated testing in CI** — run Playwright smoke tests in GitHub Actions
- [ ] **Staging environment** — preview deployments with test database

### Technical Debt
- [x] **Remove unused imports and dead code** — deleted 32 orphaned files, removed 5 unused npm deps, stripped ~140 debug console.logs
- [ ] **Storybook** — component development and visual testing

---

## Future Ideas

These are larger efforts to consider once the core platform is stable.

### Monetization
- Token gifting, subscriptions, and rewards program
- Premium user tiers with advanced analytics for creators
- Stripe integration for token purchases
- Tip/donation system for content creators

### Advanced Features
- AI brief quality scoring and content similarity detection
- Content summarization for long briefs
- Knowledge graphs connecting related briefs
- Expert verification and peer review workflows
- Multi-language support (i18next, RTL)

### Scale
- Redis caching layer
- Background job queue (brief extraction, email sends)
- Database read replicas
- CDN for static assets

---

## Done

Everything below is completed. Kept for reference.

<details>
<summary>Completed features (click to expand)</summary>

### Core Platform
- Auth: session handling, error boundaries, refresh, local mode persistence
- Database: indexes, connection pooling, migration rollback, race condition fixes, FK cascades
- Validation: Zod-based input validation, form feedback, retry mechanisms
- Security: CSRF, rate limiting, XSS sanitization, CSP, SSRF prevention, CORS, bot detection, audit logging
- API: standardized response format (apiSuccess/apiError) on all 34 routes + 12 public v1 endpoints

### Features
- Full-text search with advanced filtering, suggestions, analytics
- Draft system, content versioning, bulk operations, content scheduling
- Content export (PDF, markdown, DOCX, CSV, HTML, JSON, TXT)
- Content moderation (local filter + OpenAI API, spam detection, report system)
- Recommendation engine with cron jobs and admin scoring UI
- User following/followers, social sharing, @mentions
- User reputation system, token system with transactions
- Dark mode, keyboard navigation, onboarding flow, tooltips
- PWA with service worker, offline support, install prompts
- GDPR compliance (data export, account deletion, cookie consent)

### Extractors
- Unified architecture: ChatGPT, Perplexity, Claude, Google, Google Docs
- ChatGPT Deep Research extractor, conversation detection
- Perplexity structured DOM extraction

### Testing & DevOps
- Playwright E2E: 21 smoke tests, 35 API format tests, page-specific deep tests
- CI/CD: GitHub Actions, Vercel deployment
- Dev experience: Husky + lint-staged, seed data, local/remote DB switching
- TypeScript strict mode with noUncheckedIndexedAccess

### UI Components
- LazyBriefCard, virtual scrolling, loading skeletons
- ReadingProgressBar, TableOfContents, FileDropzone
- EmptyState presets, confirmation dialogs, error popups
- Mobile/tablet layouts, touch gestures, responsive navigation

</details>
