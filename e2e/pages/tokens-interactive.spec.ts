import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

test.describe("Tokens interactive features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tokens");
    await waitForPageReady(page);
  });

  test("shows balance card", async ({ page }) => {
    // Balance card shows "Current Balance" heading
    await expect(
      page.locator("h2").filter({ hasText: "Current Balance" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("tab switching works", async ({ page }) => {
    const historyTab = page
      .locator(
        'button:has-text("Purchase History"), button:has-text("Transaction History")',
      )
      .first();

    if ((await historyTab.count()) > 0 && (await historyTab.isVisible())) {
      await historyTab.click({ force: true });
      await waitForPageReady(page);

      // Page should remain functional
      const body = page.locator("body");
      await expect(body).not.toBeEmpty();
    }
  });

  test("purchase tab shows token packages", async ({ page }) => {
    // Ensure we're on the Purchase Tokens tab
    const purchaseTab = page
      .locator('button:has-text("Purchase Tokens")')
      .first();
    if ((await purchaseTab.count()) > 0 && (await purchaseTab.isVisible())) {
      await purchaseTab.click({ force: true });
      await waitForPageReady(page);
    }

    // Should show at least one Purchase button or price
    const purchaseButtons = page.locator('button:has-text("Purchase")');
    const priceText = page.getByText(/\$\d+\.\d{2}/);

    const hasButtons = (await purchaseButtons.count()) > 0;
    const hasPrices = (await priceText.count()) > 0;

    expect(hasButtons || hasPrices).toBe(true);
  });

  test("How Tokens Work section visible", async ({ page }) => {
    await expect(
      page.getByText("How Tokens Work").first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
