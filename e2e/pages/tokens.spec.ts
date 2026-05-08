import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Tokens page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tokens");
    await waitForPageReady(page);
  });

  test("renders without errors", async ({ page, diagnostics }) => {
    await expectPageLoaded(page, diagnostics);
  });

  test("shows balance card", async ({ page }) => {
    await expect(page.getByText("Current Balance").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("has tabs", async ({ page }) => {
    await expect(
      page.getByText("Purchase Tokens").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Purchase History").first(),
    ).toBeVisible();
    await expect(
      page.getByText("Transaction History").first(),
    ).toBeVisible();
  });

  test('shows "How Tokens Work" section', async ({ page }) => {
    await expect(
      page.getByText("How Tokens Work").first(),
    ).toBeVisible();
  });
});
