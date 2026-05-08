import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("My Briefs page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/my-briefs");
    await waitForPageReady(page);
  });

  test("renders without errors", async ({ page, diagnostics }) => {
    await expectPageLoaded(page, diagnostics);
  });

  test("shows heading", async ({ page }) => {
    // Use heading role to avoid matching hidden nav tooltips
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("shows brief cards or empty state", async ({ page }) => {
    const briefCards = page.locator('a[href^="/briefs/"]');
    const emptyOrError = page
      .getByText(/no.*briefs|no.*contributions|no.*research|get started/i)
      .first();

    const hasBriefs = (await briefCards.count()) > 0;
    const hasMessage = (await emptyOrError.count()) > 0;

    expect(hasBriefs || hasMessage).toBe(true);
  });
});
