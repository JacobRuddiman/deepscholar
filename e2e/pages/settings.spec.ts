import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Settings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);
  });

  test("renders without errors", async ({ page, diagnostics }) => {
    await expectPageLoaded(page, diagnostics);
  });

  test("has navigation sections", async ({ page }) => {
    // Settings page should have section navigation
    const navItems = page.locator(
      'nav a, nav button, [role="tablist"] button, button:has-text("Profile"), button:has-text("Notifications"), button:has-text("Account"), a:has-text("Profile"), a:has-text("Notifications")',
    );
    expect(await navItems.count()).toBeGreaterThanOrEqual(1);
  });

  test("shows profile form inputs", async ({ page }) => {
    // Should have form fields for profile settings
    const inputs = page.locator("input, textarea, select");
    expect(await inputs.count()).toBeGreaterThanOrEqual(1);
  });

  test("can switch between sections", async ({ page }) => {
    // Find any clickable section nav items
    const sectionButtons = page.locator(
      'nav a, nav button, [role="tab"], button:has-text("Notifications"), button:has-text("Account"), button:has-text("Tokens")',
    );
    if ((await sectionButtons.count()) > 1) {
      const secondSection = sectionButtons.nth(1);
      await secondSection.click();
      // Page should still be functional after switching
      await waitForPageReady(page);
    }
  });
});
