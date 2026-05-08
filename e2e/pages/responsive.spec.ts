import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Responsive - mobile viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("home renders at mobile viewport", async ({ page, diagnostics }) => {
    await page.goto("/home");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("DeepScholar").first()).toBeVisible();
    await expectPageLoaded(page, diagnostics);
  });

  test("briefs renders at mobile viewport", async ({ page, diagnostics }) => {
    await page.goto("/briefs");
    await waitForPageReady(page);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
    await expectPageLoaded(page, diagnostics);
  });

  test("profile renders at mobile viewport", async ({ page, diagnostics }) => {
    await page.goto("/profile");
    await waitForPageReady(page);

    await expect(page.getByText("Demo User").first()).toBeVisible({
      timeout: 10_000,
    });
    await expectPageLoaded(page, diagnostics);
  });
});
