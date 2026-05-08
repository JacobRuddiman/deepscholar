import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

test.describe("404 Not Found", () => {
  test("non-existent page shows 404", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await waitForPageReady(page);

    // Should show 404 text or Next.js default not-found page
    const notFoundText = page
      .getByText(/404|not found|page.*not.*found|does not exist/i)
      .first();
    await expect(notFoundText).toBeVisible({ timeout: 10_000 });
  });

  test("non-existent API route returns 404", async ({ request }) => {
    const response = await request.get("/api/nonexistent");
    expect(response.status()).toBe(404);
  });
});
