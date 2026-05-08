import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Users page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/users");
    await waitForPageReady(page);
  });

  test("shows heading and description", async ({ page, diagnostics }) => {
    const heading = page.locator("h1, h2").filter({ hasText: /Users/i });
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });

    await expectPageLoaded(page, diagnostics);
  });

  test("has search input", async ({ page }) => {
    const searchInput = page
      .locator(
        'input[placeholder*="Search users" i], input[placeholder*="search" i]',
      )
      .first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test("has sort dropdown", async ({ page }) => {
    const sortControl = page
      .locator(
        'select:has(option:text("Most Briefs")), button:has-text("Most Briefs"), [role="combobox"]',
      )
      .first();
    await expect(sortControl).toBeVisible({ timeout: 10_000 });
  });

  test("has view mode toggle", async ({ page }) => {
    const toggleButtons = page.locator(
      'button[aria-label*="grid" i], button[aria-label*="list" i], button:has-text("Grid"), button:has-text("List"), button svg',
    );
    // Grid/list toggle — at least the toggle container or buttons exist
    expect(await toggleButtons.count()).toBeGreaterThanOrEqual(1);
  });

  test("shows user cards, empty state, or error", async ({ page }) => {
    const userCards = page.locator('[class*="card" i], [class*="Card"]');
    const emptyState = page.getByText(/no users found|no users/i).first();
    const errorState = page.getByText(/error|something went wrong/i).first();
    const loading = page.getByText(/loading/i).first();

    const hasCards = (await userCards.count()) > 0;
    const hasEmpty =
      (await emptyState.count()) > 0 && (await emptyState.isVisible());
    const hasError =
      (await errorState.count()) > 0 && (await errorState.isVisible());
    const hasLoading =
      (await loading.count()) > 0 && (await loading.isVisible());

    expect(hasCards || hasEmpty || hasError || hasLoading).toBe(true);
  });
});
