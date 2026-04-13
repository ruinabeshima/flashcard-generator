import test, { BrowserContext, expect, Route } from "@playwright/test";
import { mockAuthSignedIn, waitForAuthToLoad } from "./helpers/auth";

test.describe("Applications Management", () => {
  const TEST_EMAIL = "test@apply-wise.local";
  const TEST_UID = "test-user-123";

  // Mock /auth/status as onboarding complete
  async function mockOnboardingComplete(context: BrowserContext) {
    await context.route("**/auth/status", (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ onboardingComplete: true }),
      });
    });
  }

  // Mock GET /applications (empty initially)
  async function mockApplicationsEmpty(context: BrowserContext) {
    await context.route("**/applications", (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
  }

  test.describe("Dashboard - Applications List", () => {
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

    test("displays empty state when no applications exist", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);
      await mockApplicationsEmpty(context);

      await page.goto("/dashboard");
      await waitForAuthToLoad(page);

      await expect(page.getByText(/no applications yet/i)).toBeVisible();
      await expect(
        page.getByRole("link", { name: /add your first application/i }),
      ).toBeVisible();
    });

    test("displays error state when loading fails", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);

      await context.route("**/applications", (route: Route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      });

      await page.goto("/dashboard");
      await waitForAuthToLoad(page);
      const errorAlert = page.getByRole("alert");
      await expect(errorAlert).toBeVisible();
    });
  });

  test.describe("Add Application Flow", () => {
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

    test("navigates to add application page from dashboard", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);
      await mockApplicationsEmpty(context);

      await page.goto("/dashboard");
      await waitForAuthToLoad(page);

      const addBtn = page.getByRole("link", { name: /add application/i });
      await expect(addBtn).toBeVisible();

      await Promise.all([
        page.waitForURL("**/applications/add"),
        addBtn.first().click(),
      ]);
    });
  });
});
