import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Export page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/export");
    await waitForPageReady(page);
  });

  test("renders without auth error", async ({ page, diagnostics }) => {
    expect(page.url()).toContain("/export");
    await expectPageLoaded(page, diagnostics);
  });

  test("shows export type cards", async ({ page }) => {
    // Export page shows: Research Brief, User Profile, Search Results
    await expect(
      page.getByText("Research Brief").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("User Profile").first()).toBeVisible();
    await expect(page.getByText("Search Results").first()).toBeVisible();
  });

  test("shows usage stats sidebar", async ({ page }) => {
    await expect(
      page.getByText("Usage Statistics").first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
