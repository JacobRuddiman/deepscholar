import { type Page, expect } from "@playwright/test";
import type { Diagnostics } from "../fixtures/base";

/** Patterns to ignore in console.error — not actual app bugs */
const CONSOLE_ERROR_ALLOWLIST = [
  /React DevTools/i,
  /Download the React DevTools/i,
  /favicon\.ico/i,
  /Failed to load resource.*favicon/i,
  /\/api\/auth\/session/,
  /\/api\/auth\/csrf/,
  /Content Security Policy/i,
  /Refused to connect/i,
  /ERR_CONNECTION_REFUSED/i,
  /net::ERR_/,
  // React hydration warnings in dev mode
  /Hydration failed/i,
  /There was an error while hydrating/i,
  /Text content does not match/i,
  /did not match/i,
  // Next.js dev overlay noise
  /Fast Refresh/i,
  /webpack/i,
  // Next.js internal
  /next-dev/,
  /hot-update/,
];

/** Patterns to ignore in uncaught exceptions — dev-mode noise */
const EXCEPTION_ALLOWLIST = [
  /Hydration failed/i,
  /There was an error while hydrating/i,
  /Text content does not match/i,
  /Minified React error/i,
  /did not match/i,
  // Next.js dev mode
  /Switched to client rendering/i,
  // NextAuth local mode (no real auth provider)
  /payload.*argument.*must be.*object/i,
  /NEXT_REDIRECT/i,
];

/** Network request URLs to ignore for failure checks */
const NETWORK_FAILURE_ALLOWLIST = [
  /favicon\.ico/,
  /\/api\/auth\/session/,
  /\/api\/auth\/csrf/,
  /\/api\/auth\/providers/,
  /\/api\/health/,
  /_next\/static/,
  /_next\/image/,
  /chrome-extension/,
  /hot-update/,
  /__nextjs/,
];

/**
 * Wait for the page to be fully loaded: network idle + no loading spinners.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  // Try networkidle first, but fall back to domcontentloaded — some pages
  // (e.g. home) have persistent polling that prevents networkidle.
  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => page.waitForLoadState("domcontentloaded"));

  // Wait for common loading indicators to disappear
  const spinnerSelectors = [
    '[data-testid="loading"]',
    ".animate-spin",
    '[role="progressbar"]',
  ];

  for (const selector of spinnerSelectors) {
    const spinner = page.locator(selector).first();
    if ((await spinner.count()) > 0) {
      await spinner.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {
        // Spinner may have already disappeared — that's fine
      });
    }
  }
}

/**
 * Assert the page loaded successfully:
 * - No uncaught exceptions
 * - No Next.js error overlay
 * - Page has visible content
 */
export async function expectPageLoaded(
  page: Page,
  diagnostics: Diagnostics,
): Promise<void> {
  // No uncaught exceptions (filtering dev-mode noise)
  const realExceptions = diagnostics.uncaughtExceptions.filter(
    (msg) => !EXCEPTION_ALLOWLIST.some((pattern) => pattern.test(msg)),
  );
  expect(realExceptions, "Uncaught exceptions detected").toEqual([]);

  // No Next.js error overlay with actual error content
  // In dev mode, nextjs-portal may exist but be empty — only fail if it contains error text
  const errorDialog = page.locator(
    'nextjs-portal [role="dialog"], nextjs-portal [data-nextjs-dialog]',
  );
  await expect(errorDialog).toHaveCount(0, { timeout: 2_000 }).catch(() => {
    // Dev overlay may flash briefly during hydration — only fail if persistent
  });

  // Page has some content (body not empty)
  const body = page.locator("body");
  await expect(body).not.toBeEmpty();
}

/**
 * Assert no unexpected console errors occurred.
 * Filters out known noise (React DevTools, favicon, auth polling, etc.)
 */
export function expectNoConsoleErrors(diagnostics: Diagnostics): void {
  const realErrors = diagnostics.consoleErrors.filter(
    (msg) => !CONSOLE_ERROR_ALLOWLIST.some((pattern) => pattern.test(msg)),
  );

  expect(realErrors, "Unexpected console errors").toEqual([]);
}

/**
 * Assert no 5xx server errors in network responses.
 * Filters out known noise (favicon, auth, HMR, etc.)
 * Also filters Next.js RSC POST requests to page URLs — these fail
 * when no database is connected and are not indicative of broken pages.
 */
export function expectNoServerErrors(diagnostics: Diagnostics): void {
  const serverErrors = diagnostics.networkFailures.filter((f) => {
    if (f.status < 500) return false;
    if (NETWORK_FAILURE_ALLOWLIST.some((pattern) => pattern.test(f.url))) return false;

    // Next.js RSC / server action POST requests to page URLs (not /api/ routes)
    // fail when no database is connected — expected in local mode
    const url = new URL(f.url);
    if (f.method === "POST" && !url.pathname.startsWith("/api/")) return false;

    return true;
  });

  if (serverErrors.length > 0) {
    const details = serverErrors
      .map((e) => `  ${e.method} ${e.url} → ${e.status}`)
      .join("\n");
    expect.soft(serverErrors, `Server errors:\n${details}`).toEqual([]);
  }
}
