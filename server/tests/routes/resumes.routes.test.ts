import request from "supertest";
import createApp from "../../app";
import { prisma } from "../../lib/prisma";
import { r2 } from "../../lib/storage/r2";
import parsePDF from "../../lib/storage/parse";

// Mocks
jest.mock("../../lib/prisma");
jest.mock("../../lib/monitoring/audit");
jest.mock("../../lib/storage/r2", () => ({ r2: { send: jest.fn() } }));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue("https://fake-signed-url.com/resume.pdf"),
}));
jest.mock("../../lib/storage/parse", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const mockPrisma = jest.mocked(prisma);
const mockR2Send = r2.send as jest.Mock;
const mockParsePDF = jest.mocked(parsePDF);

let app: any;

beforeAll(async () => {
  app = await createApp();
});

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

describe("GET /resumes/tailored", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).get("/resumes/tailored");
    expect(res.status).toBe(401);
  });

  it("returns 200 list", async () => {
    mockPrisma.tailoredResume.findMany.mockResolvedValue([
      {
        id: "resume-1",
        name: "My-new-resume",
        applicationId: "application-1",
        createdAt: new Date("2026-03-18T23:31:21.834Z"),
      },
    ] as any);

    const res = await request(app)
      .get("/resumes/tailored")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(200);
  });

  it("returns 500 error", async () => {
    mockPrisma.tailoredResume.findMany.mockRejectedValue(new Error("DB down"));

    const res = await request(app)
      .get("/resumes/tailored")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(500);
  });
});

describe("GET /resumes/tailored/:id", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).get("/resumes/tailored/resume-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 no tailored resume", async () => {
    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/resumes/tailored/resume-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Tailored resume not found" });
  });

  it("returns 200 signed URL", async () => {
    mockPrisma.tailoredResume.findFirst.mockResolvedValue({
      key: "tailored-pdf-key",
    } as any);

    const res = await request(app)
      .get("/resumes/tailored/resume-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ url: "https://fake-signed-url.com/resume.pdf" });
  });

  it("returns 500 error", async () => {
    mockPrisma.tailoredResume.findFirst.mockRejectedValue(new Error("DB down"));

    const res = await request(app)
      .get("/resumes/tailored/resume-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error" });
  });
});

describe("POST /resumes/upload", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).post("/resumes/upload");
    expect(res.status).toBe(401);
  });

  it("returns 400 no file", async () => {
    const res = await request(app)
      .post("/resumes/upload")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "No file uploaded" });
  });

  it("returns 400 parse failure", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue(null);
    mockR2Send.mockResolvedValue({} as any);
    mockParsePDF.mockResolvedValue("");

    const res = await request(app)
      .post("/resumes/upload")
      .set("x-test-user-id", "user-1")
      .attach("file", Buffer.from("fake-pdf-content"), "resume.pdf");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Failed to parse resume" });
  });

  it("returns 201 success upload/upsert", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue(null);
    mockR2Send.mockResolvedValue({} as any);
    mockParsePDF.mockResolvedValue("Parsed resume text");
    mockPrisma.resume.upsert.mockResolvedValue({ id: "resume-1" } as any);

    const res = await request(app)
      .post("/resumes/upload")
      .set("x-test-user-id", "user-1")
      .attach("file", Buffer.from("fake-pdf-content"), "resume.pdf");

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: "resume-1",
      message: "File sent successfully",
    });
  });

  it("returns 500 storage/db failure", async () => {
    mockPrisma.resume.findUnique.mockResolvedValue(null);
    mockR2Send.mockRejectedValue(new Error("R2 down"));

    const res = await request(app)
      .post("/resumes/upload")
      .set("x-test-user-id", "user-1")
      .attach("file", Buffer.from("fake-pdf-content"), "resume.pdf");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error" });
  });
});
