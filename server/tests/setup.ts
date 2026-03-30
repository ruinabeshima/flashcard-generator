process.env.CLERK_WEBHOOK_SECRET = "whsec_test_secret";
process.env.R2_BUCKET_NAME = "test-bucket";
process.env.OPENAI_API_KEY = "test-openai-api-key";

// Mock Clerk Auth middleware requireAuth()
jest.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  requireAuth: () => (req: any, res: any, next: any) => {
    const userId = req.headers["x-test-user-id"];
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    req.auth = { userId };
    next();
  },
}));
