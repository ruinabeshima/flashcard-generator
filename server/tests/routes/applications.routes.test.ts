import request from "supertest";
import createApp from "../../app";
import { prisma } from "../../lib/prisma";

// Mock prisma client and auditing
jest.mock("../../lib/prisma");
const mockPrisma = jest.mocked(prisma);
jest.mock("../../lib/monitoring/audit");

const app = createApp();

describe("/GET applications", () => {
  it("returns 401 when no user is authenticated", async () => {
    const res = await request(app).get("/applications");
    expect(res.status).toBe(401);
  });

  it("returns 200 with applications", async () => {
    mockPrisma.application.findMany.mockResolvedValue([
      {
        id: "application-1",
        role: "software engineer",
        company: "Google",
        status: "APPLIED",
        appliedDate: new Date("2026-03-18T23:31:21.834Z"),
        notes: null,
        jobUrl: null,
        userId: "user-1",
        createdAt: new Date("2026-03-18T23:31:21.834Z"),
        updatedAt: new Date("2026-03-18T23:31:21.834Z"),
      },
    ]);

    const res = await request(app)
      .get("/applications")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      id: "application-1",
      role: "software engineer",
      company: "Google",
      status: "APPLIED",
      appliedDate: "2026-03-18T23:31:21.834Z",
      notes: null,
      jobUrl: null,
    });
  });

  it("returns 500 when database fails", async () => {
    mockPrisma.application.findMany.mockRejectedValue(new Error("DB down"));

    const res = await request(app)
      .get("/applications")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(500);
  });
});
