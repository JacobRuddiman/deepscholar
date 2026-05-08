import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Profile page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await waitForPageReady(page);
  });

  test("shows user name", async ({ page, diagnostics }) => {
    await expect(page.getByText("Demo User").first()).toBeVisible({
      timeout: 10_000,
    });
    await expectPageLoaded(page, diagnostics);
  });

  test("shows stat cards", async ({ page }) => {
    // Profile shows: Briefs (0), Reviews (0), Upvotes (0), Saved (0)
    // Use visible locators that exclude hidden nav tooltips
    const statsSection = page.locator("text=Recent Briefs").first();
    await expect(statsSection).toBeVisible({ timeout: 10_000 });
  });

  test("has activity section", async ({ page }) => {
    await expect(
      page.locator("h2, h3").filter({ hasText: /activity/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
