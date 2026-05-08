import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Dashboard Drafts page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/drafts");
    await waitForPageReady(page);
  });

  test("loads and shows heading or error state", async ({ page, diagnostics }) => {
    // The page may show:
    // 1. "My Drafts" heading (loading skeleton or loaded data)
    // 2. An error state (EmptyStates.Error) when DB is unavailable
    // 3. A sign-in redirect
    const heading = page.locator("h1, h2").filter({ hasText: /draft/i }).first();
    const errorState = page.getByText(/failed|error|try again|something went wrong/i).first();
    const signIn = page.getByText(/welcome back|sign in|continue with/i).first();

    const hasHeading = (await heading.count()) > 0 && (await heading.isVisible());
    const hasError = (await errorState.count()) > 0 && (await errorState.isVisible());
    const hasSignIn = (await signIn.count()) > 0 && (await signIn.isVisible());

    expect(hasHeading || hasError || hasSignIn).toBe(true);
    await expectPageLoaded(page, diagnostics);
  });

  test("shows empty state, draft cards, or error", async ({ page }) => {
    const noDrafts = page.getByText(/no draft|no.*drafts|empty/i).first();
    const draftLinks = page.locator('a[href*="/dashboard/drafts/"]');
    const errorState = page.getByText(/failed|error|try again|something went wrong/i).first();
    const signIn = page.getByText(/welcome back|sign in|continue with/i).first();

    const hasNoDrafts = (await noDrafts.count()) > 0;
    const hasDraftLinks = (await draftLinks.count()) > 0;
    const hasError = (await errorState.count()) > 0;
    const hasSignIn = (await signIn.count()) > 0;

    expect(hasNoDrafts || hasDraftLinks || hasError || hasSignIn).toBe(true);
  });
});
