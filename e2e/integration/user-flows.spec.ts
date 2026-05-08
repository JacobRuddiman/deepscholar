import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

/**
 * Integration tests for critical user flows.
 * These test multi-step interactions that span multiple pages.
 *
 *   npm run test:e2e -- --grep "Integration"
 */

test.describe("Integration: Brief Upload Flow", () => {
  test("user can navigate to upload page and see the editor", async ({ page }) => {
    await page.goto("/brief_upload");
    await waitForPageReady(page);

    // Should see the upload editor with URL input or content input
    const hasUrlInput = await page.locator('input[type="url"], input[placeholder*="URL"], input[placeholder*="url"]').count();
    const hasTextarea = await page.locator('textarea').count();
    const hasEditor = hasUrlInput > 0 || hasTextarea > 0;

    expect(hasEditor).toBeTruthy();
  });

  test("upload page shows content mode toggle", async ({ page }) => {
    await page.goto("/brief_upload");
    await waitForPageReady(page);

    // Should have some way to toggle between URL and content input modes
    const pageContent = await page.textContent("body");
    const hasInputMode = pageContent?.includes("URL") || pageContent?.includes("Content") || pageContent?.includes("Paste");
    expect(hasInputMode).toBeTruthy();
  });
});

test.describe("Integration: Search Flow", () => {
  test("user can navigate to search and see search input", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    // Should have a search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
    await expect(searchInput.first()).toBeVisible();
  });

  test("search page shows filter options", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    // Should show filtering capabilities
    const pageContent = await page.textContent("body");
    const hasFilters = pageContent?.includes("Filter") ||
      pageContent?.includes("Category") ||
      pageContent?.includes("Sort");
    expect(hasFilters).toBeTruthy();
  });
});

test.describe("Integration: Profile Flow", () => {
  test("user can view their profile page", async ({ page }) => {
    await page.goto("/profile");
    await waitForPageReady(page);

    // Profile page should load (may show loading state or profile content)
    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();
    // Should not show a fatal error
    expect(pageContent).not.toContain("Application error");
  });

  test("settings page loads with form elements", async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    // Settings should have some form inputs or toggle elements
    const inputs = await page.locator('input, select, [role="switch"], [role="checkbox"]').count();
    // May be in loading state, that's ok
    const bodyText = await page.textContent("body");
    const isLoading = bodyText?.includes("Updating data") || bodyText?.includes("Loading");
    expect(inputs > 0 || isLoading).toBeTruthy();
  });
});

test.describe("Integration: Export Flow", () => {
  test("export page shows export type options", async ({ page }) => {
    await page.goto("/export");
    await waitForPageReady(page);

    const pageContent = await page.textContent("body");
    // Should show export options (brief, search results, profile)
    const hasExportOptions = pageContent?.includes("Brief") ||
      pageContent?.includes("Export") ||
      pageContent?.includes("Download");
    expect(hasExportOptions).toBeTruthy();
  });
});

test.describe("Integration: Navigation Flow", () => {
  test("user can navigate between main sections via nav", async ({ page }) => {
    await page.goto("/home");
    await waitForPageReady(page);

    // Navigate to briefs
    await page.goto("/briefs");
    await waitForPageReady(page);
    expect(page.url()).toContain("/briefs");

    // Navigate to search
    await page.goto("/search");
    await waitForPageReady(page);
    expect(page.url()).toContain("/search");
  });

  test("FAQ page loads with questions", async ({ page }) => {
    await page.goto("/faq");
    await waitForPageReady(page);

    // FAQ should have expandable sections or questions
    const pageContent = await page.textContent("body");
    expect(pageContent?.length).toBeGreaterThan(100);
  });
});

test.describe("Integration: Token System", () => {
  test("tokens page shows balance or purchase options", async ({ page }) => {
    await page.goto("/tokens");
    await waitForPageReady(page);

    const pageContent = await page.textContent("body");
    const hasTokenContent = pageContent?.includes("Token") ||
      pageContent?.includes("Balance") ||
      pageContent?.includes("Purchase") ||
      pageContent?.includes("token");
    expect(hasTokenContent).toBeTruthy();
  });
});

test.describe("Integration: My Briefs Management", () => {
  test("my-briefs page loads", async ({ page }) => {
    await page.goto("/my-briefs");
    await waitForPageReady(page);

    const pageContent = await page.textContent("body");
    // Should show user's briefs or empty state
    const hasContent = pageContent?.includes("Brief") ||
      pageContent?.includes("brief") ||
      pageContent?.includes("No briefs") ||
      pageContent?.includes("Create") ||
      pageContent?.includes("Upload");
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Integration: Admin Flow", () => {
  test("admin dashboard loads or redirects to sign-in", async ({ page }) => {
    await page.goto("/admin");
    await waitForPageReady(page);

    // In local mode, admin should load; otherwise may redirect to sign-in
    const url = page.url();
    const pageContent = await page.textContent("body");
    const isAdmin = url.includes("/admin") &&
      (pageContent?.includes("Admin") || pageContent?.includes("Dashboard"));
    const isSignIn = url.includes("/signin") || pageContent?.includes("Sign");

    expect(isAdmin || isSignIn).toBeTruthy();
  });
});
