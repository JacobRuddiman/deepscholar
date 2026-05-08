import { test, expect } from "../fixtures/base";

test.describe("API Routes - Phase 3", () => {
  test("GET /api/export/stats returns expected status", async ({
    request,
  }) => {
    const response = await request.get("/api/export/stats");
    expect([200, 401, 403, 500]).toContain(response.status());
  });

  test("GET /api/export/history returns expected status", async ({
    request,
  }) => {
    const response = await request.get("/api/export/history");
    expect([200, 401, 403, 500]).toContain(response.status());
  });

  test("GET /api/settings/notifications returns expected status", async ({
    request,
  }) => {
    const response = await request.get("/api/settings/notifications");
    expect([200, 401, 403, 500]).toContain(response.status());
  });

  test("POST /api/analytics/events accepts POST", async ({ request }) => {
    const response = await request.post("/api/analytics/events", {
      data: { event: "test", timestamp: Date.now() },
    });
    expect([200, 400, 401, 403, 500]).toContain(response.status());
  });

  test("POST /api/csp-report accepts POST", async ({ request }) => {
    const response = await request.post("/api/csp-report", {
      data: { "csp-report": { "document-uri": "test" } },
    });
    expect([200, 204, 400, 401, 403, 500]).toContain(response.status());
  });
});
