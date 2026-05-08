import { test, expect } from "./fixtures/base";
import { waitForPageReady, expectPageLoaded } from "./helpers/assertions";

/**
 * Smoke tests — the primary suite Claude runs after edits.
 * Verifies every page loads without crashes or server errors.
 *
 *   npm run test:e2e:smoke
 */

const PAGES = [
  { path: "/home", name: "Home" },
  { path: "/briefs", name: "Browse Briefs" },
  { path: "/brief_upload", name: "Brief Upload" },
  { path: "/search", name: "Search" },
  { path: "/profile", name: "Profile" },
  { path: "/settings", name: "Settings" },
  { path: "/tokens", name: "Tokens" },
  { path: "/export", name: "Export" },
  { path: "/my-briefs", name: "My Briefs" },
  { path: "/auth/signin", name: "Sign In" },
  { path: "/admin", name: "Admin Dashboard" },
  { path: "/faq", name: "FAQ" },
  { path: "/privacy", name: "Privacy" },
  { path: "/terms", name: "Terms" },
  { path: "/onboarding", name: "Onboarding" },
  { path: "/users", name: "Users" },
  { path: "/dashboard/drafts", name: "Dashboard Drafts" },
  { path: "/unsubscribe", name: "Unsubscribe" },
  { path: "/offline", name: "Offline" },
] as const;

for (const { path, name } of PAGES) {
  test(`${name} (${path}) loads without errors`, async ({
    page,
    diagnostics,
  }) => {
    await page.goto(path);
    await waitForPageReady(page);
    await expectPageLoaded(page, diagnostics);
  });
}

test("/ redirects to /home", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL("**/home", { timeout: 10_000 });
  expect(page.url()).toContain("/home");
});

test("GET /api/health returns valid response", async ({ request }) => {
  const response = await request.get("/api/health");
  // 200 = healthy, 503 = degraded (e.g. no DB in local mode) — both are valid
  expect([200, 503]).toContain(response.status());

  const body = await response.json();
  // Standardized envelope: { success, data: { status, uptime, checks }, timestamp }
  expect(body).toHaveProperty("success");
  expect(body).toHaveProperty("timestamp");
  expect(body).toHaveProperty("data");
  expect(body.data).toHaveProperty("status");
  expect(body.data).toHaveProperty("uptime");
  expect(body.data).toHaveProperty("checks");
});
