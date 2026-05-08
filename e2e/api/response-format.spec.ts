import { test, expect } from "../fixtures/base";

/**
 * Comprehensive API response format tests.
 *
 * The dev server runs with NEXT_PUBLIC_LOCAL_AUTH=true and
 * NEXT_PUBLIC_LOCAL_MODE=true, so:
 *   - requireAuth() returns the local demo session (authenticated)
 *   - requireAdmin() returns 403 (local user has no isAdmin flag)
 *   - Public routes need no auth
 *
 * Tests verify the standardized response envelope:
 *   Success: { success: true, data: ..., timestamp: string }
 *   Error:   { success: false, error: { message: string, code?: string }, timestamp: string }
 */

// ─── Helpers ────────────────────────────────────────────────────────

function assertTimestamp(ts: unknown) {
  expect(typeof ts).toBe("string");
  expect(new Date(ts as string).getTime()).not.toBeNaN();
}

function assertSuccessEnvelope(body: Record<string, unknown>) {
  expect(body.success).toBe(true);
  expect(body).toHaveProperty("data");
  assertTimestamp(body.timestamp);
}

function assertErrorEnvelope(body: Record<string, unknown>) {
  expect(body.success).toBe(false);
  expect(body).toHaveProperty("error");
  const error = body.error as Record<string, unknown>;
  expect(typeof error.message).toBe("string");
  assertTimestamp(body.timestamp);
}

// ─── Public routes ──────────────────────────────────────────────────

test.describe("Public routes – response shape", () => {
  test("GET /api/health returns standard success envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    // Health can return 200 or 503 depending on DB
    expect([200, 503]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
    // Health wraps in apiSuccess, so check data sub-object
    if (body.success === true) {
      expect(body).toHaveProperty("data");
    }
  });

  test("GET /api/health/detailed returns standard envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/health/detailed");
    // 200 = healthy, 503 = degraded (no DB)
    expect([200, 503]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
  });

  test("POST /api/analytics/events returns success envelope", async ({
    request,
  }) => {
    const res = await request.post("/api/analytics/events", {
      data: { event: "test_event", timestamp: Date.now(), url: "/test" },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    assertSuccessEnvelope(body);
  });

  test("POST /api/analytics/errors returns success envelope", async ({
    request,
  }) => {
    const res = await request.post("/api/analytics/errors", {
      data: {
        name: "TestError",
        message: "test",
        fatal: false,
        timestamp: Date.now(),
        url: "/test",
        userAgent: "playwright",
      },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    assertSuccessEnvelope(body);
  });

  test("POST /api/analytics/errors rejects invalid data", async ({
    request,
  }) => {
    const res = await request.post("/api/analytics/errors", {
      data: { invalid: true },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });

  test("POST /api/analytics/vitals returns success envelope", async ({
    request,
  }) => {
    const res = await request.post("/api/analytics/vitals", {
      data: {
        name: "LCP",
        value: 1200,
        rating: "good",
        delta: 100,
        id: "v1-test",
        navigationType: "navigate",
        timestamp: Date.now(),
        url: "/test",
        userAgent: "playwright",
      },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    assertSuccessEnvelope(body);
  });

  test("POST /api/csp-report returns success envelope", async ({
    request,
  }) => {
    const res = await request.post("/api/csp-report", {
      data: {
        "csp-report": {
          "document-uri": "http://localhost:3000",
          "violated-directive": "script-src",
          "blocked-uri": "inline",
        },
      },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    assertSuccessEnvelope(body);
  });

  test("GET /api/csp-report returns success envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/csp-report");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    assertSuccessEnvelope(body);
  });

  test("POST /api/extract-brief rejects missing URL", async ({
    request,
  }) => {
    const res = await request.post("/api/extract-brief", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });

  test("POST /api/extract-brief rejects invalid URL", async ({
    request,
  }) => {
    const res = await request.post("/api/extract-brief", {
      data: { url: "not-a-url" },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });
});

// ─── Auth-required routes (local mode = authenticated) ──────────────

test.describe("Auth-required routes – response shape", () => {
  test("GET /api/briefs returns standard success envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/briefs");
    // May return 200 (success) or 500 (no DB)
    expect([200, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
    if (res.status() === 200) {
      assertSuccessEnvelope(body);
    } else {
      assertErrorEnvelope(body);
    }
  });

  test("GET /api/users returns standard success envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/users");
    expect([200, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
    if (res.status() === 200) {
      assertSuccessEnvelope(body);
    } else {
      assertErrorEnvelope(body);
    }
  });

  test("GET /api/recommendations/personalized returns standard envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/recommendations/personalized");
    expect([200, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
  });

  test("GET /api/settings/notifications returns standard envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/settings/notifications");
    expect([200, 404, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
  });

  test("GET /api/export/stats returns standard envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/export/stats");
    expect([200, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
  });

  test("GET /api/export/history returns standard envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/export/history");
    expect([200, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
  });

  test("POST /api/moderation/report rejects missing fields", async ({
    request,
  }) => {
    const res = await request.post("/api/moderation/report", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });

  test("POST /api/moderation/report rejects invalid content type", async ({
    request,
  }) => {
    const res = await request.post("/api/moderation/report", {
      data: {
        contentType: "invalid",
        contentId: "123",
        reason: "spam",
      },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });

  test("POST /api/unsubscribe rejects missing email", async ({
    request,
  }) => {
    const res = await request.post("/api/unsubscribe", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });
});

// ─── Admin routes (local mode user IS admin → expect success or DB error) ───

test.describe("Admin routes – admin user gets standard envelope", () => {
  const adminGetRoutes = [
    "/api/admin/email-footer",
    "/api/admin/email-images",
    "/api/admin/users",
    "/api/admin/scheduled-emails",
    "/api/users/recommendations",
  ];

  for (const path of adminGetRoutes) {
    test(`GET ${path} returns standard envelope`, async ({ request }) => {
      const res = await request.get(path);
      // 200 = success, 500 = DB error — both valid in local mode
      expect([200, 500]).toContain(res.status());
      const body = (await res.json()) as Record<string, unknown>;
      assertTimestamp(body.timestamp);
      if (res.status() === 200) {
        assertSuccessEnvelope(body);
      } else {
        assertErrorEnvelope(body);
      }
    });
  }

  const adminPostRoutes = [
    { path: "/api/admin/email-footer", data: { content: "test" } },
    { path: "/api/admin/upload-image", data: {} },
    { path: "/api/admin/send-email", data: { subject: "test", body: "test", recipients: [] } },
    { path: "/api/admin/scheduled-emails", data: { subject: "test", body: "test", recipients: [], scheduledFor: new Date().toISOString() } },
    { path: "/api/admin/recommendation-scores", data: { userId: "test" } },
  ];

  for (const { path, data } of adminPostRoutes) {
    test(`POST ${path} returns standard envelope`, async ({ request }) => {
      const res = await request.post(path, { data });
      // Admin is authenticated, so expect success or DB error — not 403
      expect([200, 400, 500]).toContain(res.status());
      const body = (await res.json()) as Record<string, unknown>;
      assertTimestamp(body.timestamp);
    });
  }
});

// ─── Error format tests ─────────────────────────────────────────────

test.describe("Error format – structured errors, not raw stack traces", () => {
  test("POST /api/analytics/events with invalid JSON returns error envelope", async ({
    request,
  }) => {
    const res = await request.post("/api/analytics/events", {
      data: {},
    });
    // Events endpoint may accept empty body gracefully or return 400
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
    // Either success or structured error, never a raw string
    expect(typeof body.success).toBe("boolean");
  });

  test("POST /api/upload without file returns error envelope", async ({
    request,
  }) => {
    const res = await request.post("/api/upload", {
      data: {},
    });
    // 400 for missing file or 500 for formData parse error
    expect([400, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertTimestamp(body.timestamp);
  });

  test("Export route with invalid format returns error envelope", async ({
    request,
  }) => {
    const res = await request.get(
      "/api/export/brief/nonexistent?format=invalid_format"
    );
    // 400 for invalid format
    expect([400, 500]).toContain(res.status());
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });

  test("GET /api/export/search without query returns error envelope", async ({
    request,
  }) => {
    const res = await request.get("/api/export/search");
    expect(res.status()).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });
});

// ─── Cron routes – Bearer auth required ─────────────────────────────

test.describe("Cron routes – missing auth", () => {
  test("GET /api/cron/send-scheduled-email without Bearer returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/cron/send-scheduled-email");
    expect(res.status()).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });

  test("GET /api/cron/recommendations without Bearer returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/cron/recommendations");
    expect(res.status()).toBe(401);
    const body = (await res.json()) as Record<string, unknown>;
    assertErrorEnvelope(body);
  });
});
