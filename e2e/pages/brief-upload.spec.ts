import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Brief Upload page", () => {
  test("editor renders without auth redirect", async ({
    page,
    diagnostics,
  }) => {
    await page.goto("/brief_upload");
    await waitForPageReady(page);

    // Should stay on upload page (not redirected to signin)
    expect(page.url()).toContain("/brief_upload");
    await expectPageLoaded(page, diagnostics);
  });

  test("shows upload editor interface", async ({ page }) => {
    await page.goto("/brief_upload");
    await waitForPageReady(page);

    // The editor should have some form elements or content area
    const editorElements = page.locator(
      'textarea, [contenteditable="true"], input[type="text"], input[type="url"]',
    );
    const hasEditor = (await editorElements.count()) > 0;

    // Or it might show the extract_brief component
    const extractSection = page.locator(
      'button, [role="button"]',
    );
    const hasButtons = (await extractSection.count()) > 0;

    expect(hasEditor || hasButtons).toBe(true);
  });
});
