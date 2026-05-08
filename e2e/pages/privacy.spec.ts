import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Privacy Policy page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/privacy");
    await waitForPageReady(page);
  });

  test("shows heading and section structure", async ({
    page,
    diagnostics,
  }) => {
    await expect(
      page.locator("h1").filter({ hasText: "Privacy Policy" }),
    ).toBeVisible({ timeout: 10_000 });

    // Should have at least 5 numbered section headings
    const sectionHeadings = page.locator("h2");
    expect(await sectionHeadings.count()).toBeGreaterThanOrEqual(5);

    await expectPageLoaded(page, diagnostics);
  });

  test("shows last updated date", async ({ page }) => {
    // The page renders a dynamic date — look for date-like text
    const dateText = page
      .getByText(/last updated|effective|^\d{1,2}\/\d{1,2}\/\d{2,4}/i)
      .first();
    await expect(dateText).toBeVisible({ timeout: 10_000 });
  });

  test("has contact email reference", async ({ page }) => {
    // The email appears as plain text or as a mailto link
    const emailLink = page.locator('a[href="mailto:privacy@deepscholar.com"]');
    const emailText = page.getByText("privacy@deepscholar.com").first();

    const hasLink = (await emailLink.count()) > 0;
    const hasText =
      (await emailText.count()) > 0 && (await emailText.isVisible());

    expect(hasLink || hasText).toBe(true);
  });
});
