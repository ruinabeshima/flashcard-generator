import test, { BrowserContext, expect, Route } from "@playwright/test";
import { mockAuthSignedIn, waitForAuthToLoad } from "./helpers/auth";

test.describe("Resume Upload & Preview", () => {
  const TEST_EMAIL = "test@apply-wise.local";
  const TEST_UID = "test-user-123";

  // Mock GET /auth/status as onboarding complete
  async function mockOnboardingComplete(context: BrowserContext) {
    await context.route("**/auth/status", (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ onboardingComplete: true }),
      });
    });
  }

  test.describe("Resume Preview Page", () => {
    test.describe.configure({ mode: "serial" });
    let context: BrowserContext;

    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      await mockAuthSignedIn(context, {
        uid: TEST_UID,
        email: TEST_EMAIL,
      });
    });

    test.afterEach(async () => {
      await context.close();
    });

    test("displays error state when resume fetch fails", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);

      await context.route("**/resumes", (route: Route) => {
        if (!route.request().url().includes("/upload")) {
          route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Failed to fetch resume" }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto("/your-resume");
      await waitForAuthToLoad(page);

      const errorAlert = page.getByRole("alert");
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/error|failed/i);
    });
  });

  test.describe("Resume Upload Flow", () => {
    test.describe.configure({ mode: "serial" });
    let context: BrowserContext;

    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      await mockAuthSignedIn(context, {
        uid: TEST_UID,
        email: TEST_EMAIL,
      });
    });

    test.afterEach(async () => {
      await context.close();
    });
  });
});
