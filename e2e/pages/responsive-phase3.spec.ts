import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Responsive Phase 3 - mobile viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("settings renders at mobile viewport", async ({
    page,
    diagnostics,
  }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expectPageLoaded(page, diagnostics);
  });

  test("tokens renders at mobile viewport", async ({
    page,
    diagnostics,
  }) => {
    await page.goto("/tokens");
    await waitForPageReady(page);

    await expect(
      page.getByText(/Current Balance|token/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expectPageLoaded(page, diagnostics);
  });

  test("export renders at mobile viewport", async ({
    page,
    diagnostics,
  }) => {
    await page.goto("/export");
    await waitForPageReady(page);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expectPageLoaded(page, diagnostics);
  });

  test("users renders at mobile viewport", async ({
    page,
    diagnostics,
  }) => {
    await page.goto("/users");
    await waitForPageReady(page);

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    await expectPageLoaded(page, diagnostics);
  });
});
