import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("FAQ page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/faq");
    await waitForPageReady(page);
  });

  test("shows main heading and FAQ categories", async ({
    page,
    diagnostics,
  }) => {
    await expect(
      page.locator("h1").filter({ hasText: "Frequently Asked Questions" }),
    ).toBeVisible({ timeout: 10_000 });

    // Should have at least 3 category headings (Getting Started, Creating Briefs, etc.)
    const categoryHeadings = page.locator("h2, h3").filter({
      hasText:
        /Getting Started|Creating Briefs|Searching|Reviews|Account|Content Guidelines|Technical/,
    });
    expect(await categoryHeadings.count()).toBeGreaterThanOrEqual(3);

    await expectPageLoaded(page, diagnostics);
  });

  test("has FAQ question/answer items", async ({ page }) => {
    // FAQ questions are rendered as h3 or within clickable elements
    const questionElements = page.locator("h3, [role='button'], summary");
    expect(await questionElements.count()).toBeGreaterThanOrEqual(10);
  });

  test("has contact support link", async ({ page }) => {
    const mailto = page.locator('a[href="mailto:support@deepscholar.com"]');
    const contactButton = page.getByText("Contact Support").first();

    const hasMailto = (await mailto.count()) > 0;
    const hasButton =
      (await contactButton.count()) > 0 &&
      (await contactButton.isVisible());

    expect(hasMailto || hasButton).toBe(true);
  });
});
