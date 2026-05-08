import { test, expect } from "../fixtures/base";
import { expectPageLoaded } from "../helpers/assertions";

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home");
    // Home page has persistent polling (recommendations, analytics) that
    // prevents networkidle. Use domcontentloaded — the hero and stats
    // render immediately via SSR.
    await page.waitForLoadState("domcontentloaded");
  });

  test("shows hero heading", async ({ page, diagnostics }) => {
    await expect(page.getByText("DeepScholar").first()).toBeVisible();
    await expectPageLoaded(page, diagnostics);
  });

  test("shows search bar", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="search"]',
    );
    await expect(searchInput.first()).toBeVisible();
  });

  test("shows stat cards", async ({ page }) => {
    // Stats section shows: Research, AI Models, Contributors
    await expect(page.getByText("Research").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("AI Models").first()).toBeVisible();
    await expect(page.getByText("Contributors").first()).toBeVisible();
  });

  test("has quick action links", async ({ page }) => {
    await expect(
      page.getByText("Create Research Brief").first(),
    ).toBeVisible();
    await expect(page.getByText("Browse Research").first()).toBeVisible();
    await expect(page.getByText("My Contributions").first()).toBeVisible();
  });
});
