import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Terms of Service page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/terms");
    await waitForPageReady(page);
  });

  test("shows heading and section structure", async ({
    page,
    diagnostics,
  }) => {
    await expect(
      page.locator("h1").filter({ hasText: "Terms of Service" }),
    ).toBeVisible({ timeout: 10_000 });

    // Should have at least 5 numbered section headings
    const sectionHeadings = page.locator("h2");
    expect(await sectionHeadings.count()).toBeGreaterThanOrEqual(5);

    await expectPageLoaded(page, diagnostics);
  });

  test("shows last updated date", async ({ page }) => {
    const dateText = page
      .getByText(/last updated|effective|^\d{1,2}\/\d{1,2}\/\d{2,4}/i)
      .first();
    await expect(dateText).toBeVisible({ timeout: 10_000 });
  });

  test("has contact email reference", async ({ page }) => {
    // The email appears as plain text or as a mailto link
    const emailLink = page.locator('a[href="mailto:legal@deepscholar.com"]');
    const emailText = page.getByText("legal@deepscholar.com").first();

    const hasLink = (await emailLink.count()) > 0;
    const hasText =
      (await emailText.count()) > 0 && (await emailText.isVisible());

    expect(hasLink || hasText).toBe(true);
  });
});
