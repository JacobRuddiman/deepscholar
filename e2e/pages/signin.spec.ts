import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Sign In page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
    await waitForPageReady(page);
  });

  test("renders without errors", async ({ page, diagnostics }) => {
    await expectPageLoaded(page, diagnostics);
  });

  test("shows Google and Discord sign-in buttons", async ({ page }) => {
    const googleBtn = page.getByText(/google/i).first();
    const discordBtn = page.getByText(/discord/i).first();

    await expect(googleBtn).toBeVisible();
    await expect(discordBtn).toBeVisible();
  });

  test("shows branding", async ({ page }) => {
    const brand = page.getByText(/deepscholar/i).first();
    await expect(brand).toBeVisible();
  });

  test("has footer links", async ({ page }) => {
    // Should have links to terms / privacy
    const links = page.locator(
      'a[href*="terms"], a[href*="privacy"]',
    );
    expect(await links.count()).toBeGreaterThanOrEqual(1);
  });
});
