import request from "supertest";
import createApp from "../../app";
import { prisma } from "../../lib/prisma";

// Mock prisma client and auditing
jest.mock("../../lib/prisma");
const mockPrisma = jest.mocked(prisma);
jest.mock("../../lib/monitoring/audit");

const app = createApp();

describe("GET /auth/status", () => {
  it("returns 401 no user ID", async () => {
    const res = await request(app).get("/auth/status");
    expect(res.status).toBe(401);
  });

  it("returns 404 user not found", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/auth/status")
      .set("x-test-user-id", "user-2");
    expect(res.status).toBe(404);
  });

  it("returns 300 onboarding complete", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      clerkId: "clerk-user-1",
      email: "user1@email.com",
      imageUrl: "image.com",
      createdAt: new Date("2026-03-18T23:31:21.834Z"),
      updatedAt: new Date("2026-03-18T23:31:21.834Z"),
      onboarding_complete: true,
    });

    const res = await request(app)
      .get("/auth/status")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(200);
  });
});
