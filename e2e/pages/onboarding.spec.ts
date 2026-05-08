import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";

test.describe("Onboarding page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
    await waitForPageReady(page);
  });

  test("shows welcome heading", async ({ page, diagnostics }) => {
    await expect(
      page.getByText("Welcome to DeepScholar").first(),
    ).toBeVisible({ timeout: 10_000 });

    await expectPageLoaded(page, diagnostics);
  });

  test("has feature cards", async ({ page }) => {
    // Should show at least 2 of: Smart Organization, Collaborative Tools, Impact Tracking
    const features = page.getByText(
      /Smart Organization|Collaborative Tools|Impact Tracking/,
    );
    expect(await features.count()).toBeGreaterThanOrEqual(2);
  });

  test("has CTA buttons", async ({ page }) => {
    const uploadBtn = page.getByText("Upload Your First Brief").first();
    const homeBtn = page.getByText("Go to Homepage").first();
    const getStarted = page.getByText("Get Started").first();

    const hasUpload =
      (await uploadBtn.count()) > 0 && (await uploadBtn.isVisible());
    const hasHome =
      (await homeBtn.count()) > 0 && (await homeBtn.isVisible());
    const hasGetStarted =
      (await getStarted.count()) > 0 && (await getStarted.isVisible());

    expect(hasUpload || hasHome || hasGetStarted).toBe(true);
  });

  test("shows floating stats", async ({ page }) => {
    await expect(
      page.getByText(/Research Briefs/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(/Researchers/i).first(),
    ).toBeVisible();
  });
});
