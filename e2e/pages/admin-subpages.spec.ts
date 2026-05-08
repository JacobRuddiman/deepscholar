import { test, expect } from "../fixtures/base";
import { waitForPageReady, expectPageLoaded } from "../helpers/assertions";
import type { Page } from "@playwright/test";

/**
 * Admin sub-page tests.
 * Each admin route may show its content OR redirect to sign-in
 * depending on session state in local mode.
 */

async function assertAdminPageOrSignIn(
  page: Page,
  contentPattern: RegExp,
): Promise<void> {
  const content = page.locator("h1, h2, h3").filter({ hasText: contentPattern }).first();
  const signIn = page.getByText(/welcome back|sign in|continue with/i).first();

  const hasContent = (await content.count()) > 0 && (await content.isVisible());
  const hasSignIn = (await signIn.count()) > 0 && (await signIn.isVisible());

  expect(
    hasContent || hasSignIn,
    `Expected heading matching ${contentPattern} or sign-in page`,
  ).toBe(true);
}

test.describe("Admin Sub-Pages", () => {
  test("/admin/users loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/users");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /user/i);
  });

  test("/admin/briefs loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/briefs");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /brief/i);
  });

  test("/admin/models loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/models");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /model/i);
  });

  test("/admin/analytics loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/analytics");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /analytic/i);
  });

  test("/admin/reviews loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/reviews");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /review/i);
  });

  test("/admin/ai-reviews loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/ai-reviews");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /ai.review/i);
  });

  test("/admin/recommendations loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/recommendations");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /recommend/i);
  });

  test("/admin/emailbuilder loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/emailbuilder");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /email/i);
  });

  test("/admin/seeding loads", async ({ page, diagnostics }) => {
    await page.goto("/admin/seeding");
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
    await assertAdminPageOrSignIn(page, /seed/i);
  });
});
