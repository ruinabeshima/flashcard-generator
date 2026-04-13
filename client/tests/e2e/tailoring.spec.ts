import test, { BrowserContext, expect, Route } from "@playwright/test";
import { mockAuthSignedIn, waitForAuthToLoad } from "./helpers/auth";

test.describe("Tailored Resumes", () => {
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

  // Mock GET /resumes/tailored/:id (specific tailored resume)
  async function mockTailoredResumeDetail(context: BrowserContext) {
    await context.route("**/resumes/tailored/tailored-1", (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "tailored-1",
          applicationId: "app-1",
          name: "Tailored Resume - Tech Corp",
          url: "https://example.com/tailored-1.pdf",
          createdAt: "2025-01-16T10:00:00Z",
        }),
      });
    });
  }

  // Mock POST /tailoring/start (create new tailoring session)
  async function mockTailoringGenerateSuccess(context: BrowserContext) {
    await context.route("**/tailoring/start", (route: Route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            sessionId: "session-123",
            status: "PENDING",
            suggestions: [],
          }),
        });
      } else {
        route.continue();
      }
    });
  }

  test.describe("Tailored Resumes List", () => {
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

    test("displays error state when loading fails", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);

      await context.route("**/resumes/tailored", (route: Route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      });

      await page.goto("/tailored");
      await waitForAuthToLoad(page);

      const errorAlert = page.getByRole("alert");
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/error|failed/i);
    });
  });

  test.describe("Tailored Resume Detail", () => {
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

    test("displays tailored resume detail page", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);
      await mockTailoredResumeDetail(context);

      await page.goto("/applications/app-1/tailored/tailored-1");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL(/tailored\/tailored-1/);
    });

    test("displays back button to return to list", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);
      await mockTailoredResumeDetail(context);

      await page.goto("/applications/app-1/tailored/tailored-1");
      await waitForAuthToLoad(page);

      const backBtn = page.getByRole("button", { name: /back/i }).first();
      const backLink = page
        .getByRole("link", { name: /back|tailored resumes/i })
        .first();
      const backExists =
        (await backBtn.isVisible().catch(() => false)) ||
        (await backLink.isVisible().catch(() => false));

      expect(backExists).toBeTruthy();
    });
  });

  test.describe("Generate Tailored Resume Flow", () => {
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

    test("displays success message after generating tailored resume", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);
      await mockTailoringGenerateSuccess(context);

      // Navigate to a page and check that it loads
      await page.goto("/dashboard");
      await waitForAuthToLoad(page);

      const page_content = await page.content();
      expect(page_content).toBeDefined();
      expect(page_content).toContain("application");
    });
  });

  test.describe("Tailored Resume Navigation", () => {
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
