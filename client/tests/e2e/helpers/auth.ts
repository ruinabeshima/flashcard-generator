import { Page, BrowserContext } from "@playwright/test";

/**
 * Mock Firebase Auth by intercepting network requests
 */
export async function mockAuthSignedOut(context: BrowserContext) {
  // Intercept all requests to Firebase
  await context.route("**/*", (route) => {
    const url = route.request().url();

    // Block Firebase Auth API calls
    if (url.includes("identitytoolkit") || url.includes("securetoken")) {
      route.abort();
      return;
    }

    // Allow all other requests
    route.continue();
  });

  // Also inject a script to handle auth state as signed out
  await context.addInitScript(() => {
    (window as any).__FIREBASE_AUTH_STATE__ = null;
  });
}

export async function mockAuthSignedIn(
  context: BrowserContext,
  user = { uid: "test-user-123", email: "test@example.com" },
) {
  await context.route("**/*", (route) => {
    const url = route.request().url();

    // Block Firebase Auth API calls - we'll use local state instead
    if (url.includes("identitytoolkit") || url.includes("securetoken")) {
      route.abort();
      return;
    }

    route.continue();
  });

  // Inject mock auth state before page loads
  await context.addInitScript((userData) => {
    (window as any).__FIREBASE_AUTH_STATE__ = {
      uid: userData.uid,
      email: userData.email,
      emailVerified: true,
      displayName: "Test User",
    };
  }, user);
}

/**
 * Wait for auth to complete with better error handling
 */
export async function waitForAuthToLoad(page: Page, timeout = 10000) {
  try {
    await page.waitForFunction(
      () => {
        // The app sets data-auth-loaded on the root React container, not <html>.
        return document.querySelector('[data-auth-loaded="true"]') !== null;
      },
      { timeout },
    );
  } catch (error) {
    // Get page state for debugging
    const url = page.url();
    const html = page.isClosed() ? "" : await page.content();
    const errorMsg = html.includes("Error") ? "(page shows Error)" : "";

    console.error(
      `\n❌ Auth timeout after ${timeout}ms at: ${url} ${errorMsg}`,
    );
    console.error(
      "If dev server is running, the issue is likely Firebase auth hanging.",
    );
    throw error;
  }
}
