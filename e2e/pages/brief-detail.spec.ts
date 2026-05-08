import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Brief Detail page", () => {
  test("navigates from browse to a brief detail page", async ({
    page,
    diagnostics,
  }) => {
    await page.goto("/briefs");
    await waitForPageReady(page);

    // Find the first brief link
    const briefLink = page.locator('a[href^="/briefs/"]').first();
    const hasBriefs = (await briefLink.count()) > 0;

    if (!hasBriefs) {
      test.skip(true, "No briefs available to test detail view");
      return;
    }

    await briefLink.click();
    await waitForPageReady(page);

    // Should be on a brief detail page
    expect(page.url()).toMatch(/\/briefs\/.+/);
    await expectPageLoaded(page, diagnostics);
  });

  test("brief detail shows title and content", async ({
    page,
    diagnostics,
  }) => {
    await page.goto("/briefs");
    await waitForPageReady(page);

    const briefLink = page.locator('a[href^="/briefs/"]').first();
    if ((await briefLink.count()) === 0) {
      test.skip(true, "No briefs available");
      return;
    }

    await briefLink.click();
    await waitForPageReady(page);

    // Should have a heading (the brief title)
    const headings = page.locator("h1, h2");
    await expect(headings.first()).toBeVisible();

    await expectPageLoaded(page, diagnostics);
  });
});
