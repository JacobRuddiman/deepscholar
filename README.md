# DeepScholar

A platform for sharing and discovering AI-generated research briefs. Users can extract research content from AI platforms (ChatGPT, Perplexity, Claude, Gemini), publish briefs, review content, and engage with the community through a token-based system.

## Tech Stack

- [Next.js 15](https://nextjs.org) - React framework with App Router
- [NextAuth.js](https://next-auth.js.org) - Authentication (Google, Discord)
- [Prisma](https://prisma.io) - Type-safe ORM with PostgreSQL
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [React Query](https://tanstack.com/query) - Server state management
- [Framer Motion](https://www.framer.com/motion/) - Animations

## Getting Started

```bash
npm install
npm run dev
```

For local development without a database or OAuth providers:

```bash
# Set in .env
NEXT_PUBLIC_LOCAL_AUTH=true
NEXT_PUBLIC_LOCAL_MODE=true
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment and [LOCAL_MODE_CONFIG.md](./LOCAL_MODE_CONFIG.md) for local development options.

## Project Structure

```
src/
  app/           # Next.js App Router pages and API routes
  components/    # Shared UI components
  hooks/         # Custom React hooks
  lib/           # Utilities, validation, caching
  server/        # Server actions and services
  functions/     # Brief extraction and parsing
  styles/        # Global styles
prisma/          # Database schema and migrations
e2e/             # Playwright end-to-end tests
public/          # Static assets and service worker
```
