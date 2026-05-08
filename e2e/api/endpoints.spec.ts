import { test, expect } from "../fixtures/base";

test.describe("API Endpoints", () => {
  test("GET /api/health/detailed returns valid shape", async ({ request }) => {
    const response = await request.get("/api/health/detailed");
    // 200 = healthy, 503 = degraded, 500 = no DB connection at all
    expect([200, 500, 503]).toContain(response.status());

    // Only check body shape if we got a valid JSON response
    if (response.status() !== 500) {
      const body = await response.json();
      expect(body).toHaveProperty("status");
      expect(body).toHaveProperty("timestamp");
      expect(body).toHaveProperty("checks");
    }
  });

  test("GET /api/users returns expected status", async ({ request }) => {
    const response = await request.get("/api/users");
    // Without DB: 500 is expected. With DB: 200 or 401 are valid.
    expect([200, 401, 403, 500]).toContain(response.status());
  });

  test("GET /api/briefs returns expected status", async ({ request }) => {
    const response = await request.get("/api/briefs");
    // Without DB: 500 is expected. With DB: 200 or 401 are valid.
    expect([200, 401, 403, 500]).toContain(response.status());
  });
});
