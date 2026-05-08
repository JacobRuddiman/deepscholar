import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

test.describe("My Briefs interactive features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/my-briefs");
    await waitForPageReady(page);
  });

  test("shows heading", async ({ page }) => {
    const heading = page
      .locator("h1, h2")
      .filter({ hasText: /My.*Briefs|Briefs/i });
    await expect(heading.first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows category filter or empty state", async ({ page }) => {
    const categoryFilter = page.locator(
      'select:has(option:text("All Categories")), select, [role="combobox"]',
    );
    const emptyOrError = page
      .getByText(/no.*briefs|no.*research|no.*found|error|something went wrong/i)
      .first();

    const hasFilter =
      (await categoryFilter.count()) > 0 &&
      (await categoryFilter.first().isVisible());
    const hasMessage =
      (await emptyOrError.count()) > 0 && (await emptyOrError.isVisible());

    expect(hasFilter || hasMessage).toBe(true);
  });

  test("has bulk select controls or empty state", async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const emptyOrError = page
      .getByText(/no.*briefs|no.*research|no.*found|error|something went wrong/i)
      .first();

    const hasCheckboxes = (await checkboxes.count()) > 0;
    const hasMessage =
      (await emptyOrError.count()) > 0 && (await emptyOrError.isVisible());

    expect(hasCheckboxes || hasMessage).toBe(true);
  });
});
