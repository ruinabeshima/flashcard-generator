import request from "supertest";
import createApp from "../../app";
import { prisma } from "../../lib/prisma";

// Mocks
jest.mock("../../lib/prisma");
const mockPrisma = jest.mocked(prisma);
jest.mock("../../lib/monitoring/audit");
jest.mock("../../lib/storage/r2", () => ({ r2: {} }));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue("https://fake-signed-url.com/resume.pdf"),
}));

const app = createApp();

describe("GET /resumes", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).get("/resumes");
    expect(res.status).toBe(401);
  });

  it("returns 404 no resume key", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/resumes")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(404);
  });

  it("returns 200 signed URL", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue({
      key: "pdf-key",
      userId: "user-1",
    } as any);

    const res = await request(app)
      .get("/resumes")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: "https://fake-signed-url.com/resume.pdf" });
  });
});
