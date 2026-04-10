import request from "supertest";
import createApp from "../../app";
import { prisma } from "../../lib/prisma";

// Mocks
jest.mock("../../lib/prisma");
const mockPrisma = jest.mocked(prisma);
jest.mock("../../lib/monitoring/audit");

const app = createApp();

describe("GET /tailoring/status/:applicationId", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).get("/tailoring/status/application-1");
    expect(res.status).toBe(401);
  });

  it("returns 200 status NONE", async () => {
    mockPrisma.tailoringSession.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/tailoring/status/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(200);
    expect(res.body["status"]).toEqual("NONE");
  });

  it("returns 200 status PENDING", async () => {
    mockPrisma.tailoringSession.findFirst.mockResolvedValue({
      id: "tailoring-session-1",
      status: "PENDING",
    } as any);

    const res = await request(app)
      .get("/tailoring/status/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(200);
    expect(res.body["status"]).toEqual("PENDING");
  });

  it("returns 200 status REVIEWED", async () => {
    mockPrisma.tailoringSession.findFirst.mockResolvedValue({
      id: "tailoring-session-1",
      status: "REVIEWED",
    } as any);

    const res = await request(app)
      .get("/tailoring/status/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(200);
    expect(res.body["status"]).toEqual("REVIEWED");
  });

  it("returns 404 tailored resume key not found", async () => {
    mockPrisma.tailoringSession.findFirst.mockResolvedValue({
      id: "tailoring-session-1",
      status: "TAILORED",
    } as any);

    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/tailoring/status/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(404);
  });

  it("returns 200 status TAILORED", async () => {
    mockPrisma.tailoringSession.findFirst.mockResolvedValue({
      id: "tailoring-session-1",
      status: "TAILORED",
    } as any);

    mockPrisma.tailoredResume.findFirst.mockResolvedValue({
      id: "tailored-resume-1",
      key: "key-1",
    } as any);

    const res = await request(app)
      .get("/tailoring/status/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(200);
    expect(res.body["status"]).toEqual("TAILORED");
  });

  it("returns 500 findFirst error", async () => {
    mockPrisma.tailoringSession.findFirst.mockRejectedValue(
      new Error("DB down"),
    );

    const res = await request(app)
      .get("/tailoring/status/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(500);
  });

  it("returns 500 tailoredResume findFirst error", async () => {
    mockPrisma.tailoringSession.findFirst.mockResolvedValue({
      id: "tailoring-session-1",
      status: "TAILORED",
    } as any);

    mockPrisma.tailoredResume.findFirst.mockRejectedValue(new Error("DB down"));

    const res = await request(app)
      .get("/tailoring/status/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(500);
  });
});
