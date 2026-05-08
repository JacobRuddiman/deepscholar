import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Search page", () => {
  test("shows search input", async ({ page, diagnostics }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]',
    ).first();
    await expect(searchInput).toBeVisible();
    await expectPageLoaded(page, diagnostics);
  });

  test("shows results with query param", async ({ page }) => {
    await page.goto("/search?q=research");
    await waitForPageReady(page);

    // Should show results or "no results" message
    const results = page.locator('[class*="card"], [class*="Card"]');
    const noResults = page.getByText(/no results|no briefs/i).first();

    const hasResults = (await results.count()) > 0;
    const hasNoResults = (await noResults.count()) > 0;

    expect(hasResults || hasNoResults).toBe(true);
  });

  test("shows empty/default state without query", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    // Without a query, should show a default state or all briefs
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
