import { test as base, type Page } from "@playwright/test";

export interface Diagnostics {
  consoleErrors: string[];
  consoleWarnings: string[];
  networkFailures: { url: string; status: number; method: string }[];
  uncaughtExceptions: string[];
}

/**
 * Custom test fixture that auto-collects console errors, warnings,
 * network failures (4xx/5xx), and uncaught exceptions per test.
 */
export const test = base.extend<{ diagnostics: Diagnostics }>({
  diagnostics: async ({ page }, use) => {
    const diagnostics: Diagnostics = {
      consoleErrors: [],
      consoleWarnings: [],
      networkFailures: [],
      uncaughtExceptions: [],
    };

    // Collect console messages
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error") {
        diagnostics.consoleErrors.push(text);
      } else if (msg.type() === "warning") {
        diagnostics.consoleWarnings.push(text);
      }
    });

    // Collect uncaught page errors
    page.on("pageerror", (error) => {
      diagnostics.uncaughtExceptions.push(error.message);
    });

    // Collect network failures (4xx/5xx)
    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400) {
        diagnostics.networkFailures.push({
          url: response.url(),
          status,
          method: response.request().method(),
        });
      }
    });

    await use(diagnostics);
  },
});

export { expect } from "@playwright/test";
