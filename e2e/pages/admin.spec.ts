import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    await waitForPageReady(page);
  });

  test("renders without errors", async ({ page, diagnostics }) => {
    await expectPageLoaded(page, diagnostics);
  });

  test("shows dashboard or sign-in page", async ({ page }) => {
    // In local mode, admin may show the dashboard or redirect to sign-in
    // depending on how the env vars propagate. Either is acceptable.
    const dashboard = page.getByText(/dashboard|admin|total users/i).first();
    const signIn = page.getByText(/welcome back|sign in|continue with/i).first();

    const hasDashboard = (await dashboard.count()) > 0 && (await dashboard.isVisible());
    const hasSignIn = (await signIn.count()) > 0 && (await signIn.isVisible());

    expect(hasDashboard || hasSignIn).toBe(true);
  });

  test("has navigation or action links", async ({ page }) => {
    const links = page.locator("a[href]");
    expect(await links.count()).toBeGreaterThanOrEqual(1);
  });
});
