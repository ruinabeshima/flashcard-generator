import test, { BrowserContext, expect, Route } from "@playwright/test";
import { mockAuthSignedIn } from "./helpers/auth";

test.describe("Onboarding flow", () => {
  const TEST_EMAIL = "test@apply-wise.local";
  const TEST_UID = "test-user-123";

  // Mock GET /auth/status to return onboarding incomplete
  async function mockOnboardingIncomplete(context: BrowserContext) {
    await context.route("**/auth/status", (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ onboardingComplete: false }),
      });
    });
  }

  // Mock GET /auth/status as incomplete and PATCH /auth/status as successful update
  async function mockOnboardingIncompleteAndPatchSuccess(
    context: BrowserContext,
  ) {
    let onboardingComplete = false;

    await context.route("**/auth/status", (route: Route) => {
      if (route.request().method() === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ onboardingComplete }),
        });
        return;
      }

      if (route.request().method() === "PATCH") {
        onboardingComplete = true;
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ onboardingComplete: true }),
        });
        return;
      }

      route.continue();
    });
  }

  // Mock GET /auth/status to return onboarding complete
  async function mockOnboardingComplete(context: BrowserContext) {
    await context.route("**/auth/status", (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ onboardingComplete: true }),
      });
    });
  }

  // Mock POST /resumes/upload to upload resume successfully
  async function mockResumeUploadSuccess(context: BrowserContext) {
    await context.route("**/resumes/upload", (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "resume-1",
          message: "File sent successfully",
        }),
      });
    });
  }

  test.describe("First-time user redirect", () => {
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

    test("redirects new user from dashboard to onboarding", async () => {
      const page = await context.newPage();
      await mockOnboardingIncomplete(context);
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/onboarding");
      await page.close();
    });

    test("redirects onboarded users to dashboard", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);
      await page.goto("/onboarding");
      await expect(page).toHaveURL("/dashboard");
      await page.close();
    });

    test("can access all protected routes when onboarding complete", async () => {
      const page = await context.newPage();
      await mockOnboardingComplete(context);
      await page.goto("/onboarding");
    });

    test("Shows onboarding page with resume upload component (Step 1)", async () => {
      const page = await context.newPage();
      await mockOnboardingIncomplete(context);
      await page.goto("/onboarding");

      // Step 1 page
      await expect(
        page.getByRole("heading", { name: /Set up your account/i }),
      ).toBeVisible();
      await expect(page.getByText(/Step 1 of 2/i)).toBeVisible();
      await expect(
        page.getByText(
          /Upload a resume to personalize your experience and tailor recommendations/i,
        ),
      ).toBeVisible();

      // Resume upload component
      await expect(
        page.getByRole("heading", { name: /Upload Your Resume/i }),
      ).toBeVisible();
      await expect(
        page.getByText(/Supported formats: PDF Only/i),
      ).toBeVisible();

      const progressBars = page.locator("div[class*='rounded-full']");
      await expect(progressBars.first()).toHaveClass(/bg-primary/);
    });

    test("displays validation message for unsupported file types", async () => {
      const page = await context.newPage();
      await mockOnboardingIncomplete(context);
      await page.goto("/onboarding");

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "test.txt",
        mimeType: "text/plain",
        // @ts-expect-error Node Buffer is supported in Playwright test runtime
        buffer: Buffer.from("this is not a pdf"),
      });

      await expect(page.getByText(/File must be a valid PDF/i)).toBeVisible();
    });
  });

  test.describe("Resume ready state: onboarding incomplete", () => {
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

    test("skip application and complete onboarding", async () => {
      const page = await context.newPage();
      await mockOnboardingIncompleteAndPatchSuccess(context);
      await mockResumeUploadSuccess(context);
      await page.goto("/onboarding");

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "resume.pdf",
        mimeType: "application/pdf",
        // @ts-expect-error Node Buffer is supported in Playwright test runtime
        buffer: Buffer.from("%PDF-1.4\n%Mock PDF content\n"),
      });
      await page.getByRole("button", { name: /Upload Resume/i }).click();

      await expect(page.getByText(/Step 2 of 2/i)).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /Add an Application/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /Skip for now/i }).click();
      await expect(page).toHaveURL("/dashboard");
    });
  });
});
