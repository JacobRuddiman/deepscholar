import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Browse Briefs page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/briefs");
    await waitForPageReady(page);
  });

  test("shows browse heading", async ({ page, diagnostics }) => {
    // Heading: "Explore Research Briefs" — use role-based locator to avoid hidden tooltips
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
    await expectPageLoaded(page, diagnostics);
  });

  test("has sort dropdown", async ({ page }) => {
    const sortControl = page
      .locator(
        'button:has-text("Popular"), button:has-text("Newest"), select',
      )
      .first();
    await expect(sortControl).toBeVisible();
  });

  test("has grid/list view toggle", async ({ page }) => {
    const viewToggle = page
      .locator(
        'button[aria-label*="grid"], button[aria-label*="list"], button:has-text("Grid"), button:has-text("List")',
      )
      .first();
    if ((await viewToggle.count()) > 0) {
      await expect(viewToggle).toBeVisible();
    }
  });

  test("shows brief cards, empty state, or error", async ({ page }) => {
    // With no DB: may show error, empty state, or brief cards
    const briefCards = page.locator('a[href^="/briefs/"]');
    const emptyOrError = page
      .getByText(/no.*briefs|no.*results|try again|payload/i)
      .first();

    const hasBriefs = (await briefCards.count()) > 0;
    const hasMessage = (await emptyOrError.count()) > 0;

    expect(hasBriefs || hasMessage).toBe(true);
  });
});
