import test, { BrowserContext, expect } from "@playwright/test";
import {
  mockAuthSignedOut,
  mockAuthSignedIn,
  waitForAuthToLoad,
} from "./helpers/auth";

test.describe("Auth gating and redirects", () => {
  test.describe("Signed-out users", () => {
    let context: BrowserContext;

    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      await mockAuthSignedOut(context);
    });

    test.afterEach(async () => {
      await context.close();
    });

    test('redirect from "/" to "/login"', async () => {
      // Signed-out users should stay on the '/' route
      const page = await context.newPage();
      await page.goto("/");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/");
    });

    test('redirect from "/dashboard" to "/login"', async () => {
      const page = await context.newPage();
      await page.goto("/dashboard");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/login");
    });

    test('redirect from "/your-resume" to "/login"', async () => {
      const page = await context.newPage();
      await page.goto("/your-resume");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/login");
    });

    test("can access /login page", async () => {
      const page = await context.newPage();
      await page.goto("/login");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/login");
      await expect(
        page.getByRole("button", { name: /sign in/i }),
      ).toBeVisible();
    });

    test("can access /register page", async () => {
      const page = await context.newPage();
      await page.goto("/register");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/register");
      await expect(
        page.getByRole("heading", { name: /create your account/i }),
      ).toBeVisible();
    });
  });

  test.describe("Signed-in users", () => {
    let context: BrowserContext;

    test.beforeEach(async ({ browser }) => {
      context = await browser.newContext();
      await mockAuthSignedIn(context, {
        uid: "test-123",
        email: "test@example.com",
      });
    });

    test.afterEach(async () => {
      await context.close();
    });

    test('redirect from "/login" to "/dashboard"', async () => {
      const page = await context.newPage();
      await page.goto("/login");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/dashboard");
    });

    test('redirect from "/register" to "/dashboard"', async () => {
      const page = await context.newPage();
      await page.goto("/register");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/dashboard");
    });

    test('can access "/dashboard"', async () => {
      const page = await context.newPage();
      await page.goto("/dashboard");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/dashboard");
    });

    test('can access "/your-resume"', async () => {
      const page = await context.newPage();
      await page.goto("/your-resume");
      await waitForAuthToLoad(page);
      await expect(page).toHaveURL("/your-resume");
    });

    test("can access protected routes", async () => {
      const protectedRoutes = [
        "/onboarding",
        "/your-resume",
        "/applications",
        "/applications/add",
      ];

      for (const route of protectedRoutes) {
        const page = await context.newPage();
        await page.goto(route);
        await waitForAuthToLoad(page);
        expect(page.url()).toContain(route);
        await page.close();
      }
    });
  });
});
