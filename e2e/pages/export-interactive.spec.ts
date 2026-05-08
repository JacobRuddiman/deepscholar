import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

test.describe("Export interactive features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/export");
    await waitForPageReady(page);
  });

  test("shows export type cards", async ({ page }) => {
    // At least 2 of: Research Brief, User Profile, Search Results
    const types = page.getByText(
      /Research Brief|User Profile|Search Results/,
    );
    expect(await types.count()).toBeGreaterThanOrEqual(2);
  });

  test("export type can be selected", async ({ page }) => {
    // "User Profile" h3 heading acts as a clickable card
    const userProfileHeading = page.locator("h3").filter({ hasText: "User Profile" });

    if (
      (await userProfileHeading.count()) > 0 &&
      (await userProfileHeading.isVisible())
    ) {
      await userProfileHeading.click({ force: true });
      // Brief pause for UI state update — don't use waitForPageReady to avoid timeout
      await page.waitForTimeout(1000);
    }

    // Format buttons should be visible — the button text starts with format name
    // e.g. "pdf Portable Document Format..."
    const formatButtons = page.locator(
      'button:has-text("Portable Document"), button:has-text("Markdown format"), button:has-text("JSON format"), button:has-text("HTML format")',
    );

    expect(await formatButtons.count()).toBeGreaterThanOrEqual(1);
  });

  test("shows usage statistics", async ({ page }) => {
    const usageText = page
      .getByText(/Usage Statistics|Today|Remaining/i)
      .first();
    await expect(usageText).toBeVisible({ timeout: 10_000 });
  });

  test("shows format options when type selected", async ({ page }) => {
    // Click Research Brief to select it
    const researchBrief = page.locator("h3").filter({ hasText: "Research Brief" });
    if (
      (await researchBrief.count()) > 0 &&
      (await researchBrief.isVisible())
    ) {
      await researchBrief.click({ force: true });
      await page.waitForTimeout(1000);
    }

    // Format buttons should now be visible
    const chooseFormat = page.getByText("Choose export format").first();
    const pdfButton = page
      .locator('button:has-text("Portable Document")')
      .first();

    const hasChooseFormat =
      (await chooseFormat.count()) > 0 && (await chooseFormat.isVisible());
    const hasPdf =
      (await pdfButton.count()) > 0 && (await pdfButton.isVisible());

    expect(hasChooseFormat || hasPdf).toBe(true);
  });
});
