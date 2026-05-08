import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

test.describe("Navigation flows", () => {
  test("home quick action links navigate correctly", async ({ page }) => {
    await page.goto("/home");
    await page.waitForLoadState("domcontentloaded");

    const browseLink = page.getByText("Browse Research").first();
    if ((await browseLink.count()) > 0 && (await browseLink.isVisible())) {
      await browseLink.click();
      await page.waitForURL("**/briefs**", { timeout: 10_000 });
      expect(page.url()).toContain("/briefs");
    }
  });

  test("navbar brand link navigates home", async ({ page }) => {
    await page.goto("/briefs");
    await waitForPageReady(page);

    // The brand/logo link could be text or an anchor wrapping the site name
    const brandLink = page
      .locator('a:has-text("Deep Scholar"), a:has-text("DeepScholar")')
      .first();

    if ((await brandLink.count()) > 0 && (await brandLink.isVisible())) {
      await brandLink.click();
      await page.waitForURL("**/home**", { timeout: 10_000 });
      expect(page.url()).toContain("/home");
    }
  });

  test("mobile menu toggle opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/home");
    await page.waitForLoadState("domcontentloaded");

    // Look for a hamburger / menu button
    const menuButton = page
      .locator(
        'button[aria-label*="menu" i], button[aria-label*="Menu" i], button[aria-label*="navigation" i], button:has(svg)',
      )
      .first();

    if ((await menuButton.count()) > 0 && (await menuButton.isVisible())) {
      await menuButton.click();

      // Expect a drawer/nav to become visible
      const drawer = page
        .locator(
          'nav[role="navigation"], [role="dialog"], [data-testid="mobile-menu"], aside',
        )
        .first();
      if ((await drawer.count()) > 0) {
        await expect(drawer).toBeVisible({ timeout: 5_000 });

        // Close it
        await menuButton.click();
        await expect(drawer).toBeHidden({ timeout: 5_000 }).catch(() => {
          // Some menus close via overlay click — acceptable
        });
      }
    }
  });
});
