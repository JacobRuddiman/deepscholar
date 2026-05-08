import { test, expect } from "../fixtures/base";

test.describe("Health API", () => {
  test("GET /api/health returns valid response with correct shape", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    // 200 = healthy, 503 = degraded (no DB in local mode)
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("checks");
  });

  test("health check reports database status", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    expect(body.checks).toHaveProperty("database");
    expect(body.checks).toHaveProperty("environment");
  });

  test("health check status is ok", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();

    // In local mode the database may or may not be connected,
    // but status should be either "healthy" or "degraded" — not missing
    expect(["healthy", "degraded", "ok"]).toContain(body.status);
  });
});
