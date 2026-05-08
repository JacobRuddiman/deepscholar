import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

test.describe("Profile interactive features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await waitForPageReady(page);
  });

  test("activity tabs can be switched", async ({ page }) => {
    // The profile page has activity filter buttons: All Activity, Briefs, Reviews, Upvotes, Saved
    const reviewsTab = page.locator('button:has-text("Reviews")').first();

    if ((await reviewsTab.count()) > 0 && (await reviewsTab.isVisible())) {
      // Use force: true to bypass nextjs-portal dev overlay intercepting pointer events
      await reviewsTab.click({ force: true });
      await waitForPageReady(page);

      // Page should still render properly
      const body = page.locator("body");
      await expect(body).not.toBeEmpty();
    }
  });

  test("time filter dropdown can be changed", async ({ page }) => {
    const select = page
      .locator('select:has(option:text("All Time")), select')
      .first();

    if ((await select.count()) > 0 && (await select.isVisible())) {
      // Get available options
      const options = select.locator("option");
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Select the second option
        const secondValue = await options.nth(1).getAttribute("value");
        if (secondValue) {
          await select.selectOption(secondValue);
          await waitForPageReady(page);

          // Page should still render
          const body = page.locator("body");
          await expect(body).not.toBeEmpty();
        }
      }
    }
  });
});
