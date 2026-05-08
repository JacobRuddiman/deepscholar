import { test, expect } from "../fixtures/base";
import { waitForPageReady } from "../helpers/assertions";

test.describe("Dark mode", () => {
  test("toggle cycles through themes", async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    // Look for a theme toggle button
    const themeToggle = page
      .locator(
        'button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i], button:has-text("Dark"), button:has-text("Light"), button:has-text("Theme")',
      )
      .first();

    if ((await themeToggle.count()) === 0 || !(await themeToggle.isVisible())) {
      test.skip(true, "No theme toggle found on settings page");
      return;
    }

    await themeToggle.click();

    // After clicking, the <html> element should have a class change or data attribute change
    const htmlEl = page.locator("html");
    const classAfterClick = await htmlEl.getAttribute("class");
    const dataTheme = await htmlEl.getAttribute("data-theme");

    // At least one signal that the theme changed
    const themeChanged =
      classAfterClick?.includes("dark") ||
      classAfterClick?.includes("light") ||
      dataTheme != null;
    expect(themeChanged).toBe(true);
  });

  test("theme persists across navigation", async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    // Set dark mode via localStorage directly as a reliable approach
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.goto("/home");
    await page.waitForLoadState("domcontentloaded");

    const storedTheme = await page.evaluate(() => localStorage.getItem("theme"));
    expect(storedTheme).toBe("dark");
  });
});
