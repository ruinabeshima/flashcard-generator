import request from "supertest";
import createApp from "../../app";
import { prisma } from "../../lib/prisma";
import { getApplicationInfo } from "../../lib/openai/openai";
import { getResumeSuggestions } from "../../lib/openai/openai";
import { getResumeText } from "../../lib/openai/openai";
import { parseAcceptedSuggestions } from "../../lib/tailoring/tailoring";
import { generateTailoredResume } from "../../lib/openai/openai";
import convertTextToPDF from "../../lib/tailoring/convert";
import { r2 } from "../../lib/storage/r2";
import logAudit from "../../lib/monitoring/audit";

// Mocks
jest.mock("../../lib/prisma");
const mockPrisma = jest.mocked(prisma);
jest.mock("../../lib/monitoring/audit");
const mockLogAudit = jest.mocked(logAudit);
jest.mock("../../lib/openai/openai");
jest.mock("../../lib/tailoring/tailoring", () => ({
  parseAcceptedSuggestions: jest.fn(),
}));
jest.mock("../../lib/tailoring/convert", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../lib/storage/r2", () => ({
  r2: {
    send: jest.fn(),
  },
}));
jest.mock("../../lib/ratelimit/rateLimiter", () => ({
  mutationLimiter: (req: any, res: any, next: any) => next(),
  uploadLimiter: (req: any, res: any, next: any) => next(),
  feedbackLimiter: (req: any, res: any, next: any) => next(),
}));
const mockApplicationInfo = jest.mocked(getApplicationInfo);
const mockResumeSuggestions = jest.mocked(getResumeSuggestions);
const mockResumeText = jest.mocked(getResumeText);
const mockParseAcceptedSuggestions = jest.mocked(parseAcceptedSuggestions);
const mockGenerateTailoredResume = jest.mocked(generateTailoredResume);
const mockConvertTextToPDF = jest.mocked(convertTextToPDF);
const mockR2Send = r2.send as jest.Mock;

const app = createApp();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /feedback/:applicationId", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).post("/feedback/application-1");
    expect(res.status).toBe(401);
  });

  it("returns 403 request limit reached", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "application-1",
      userId: "user-1",
    } as any);
    mockPrisma.tailoringSession.count.mockResolvedValue(3);

    const res = await request(app)
      .post("/feedback/application-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Maximum number of requests reached" });
  });

  it("returns 403 ownership mismatch", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "application-1",
      userId: "user-2",
    } as any);
    mockPrisma.tailoringSession.count.mockResolvedValue(1);

    const res = await request(app)
      .post("/feedback/application-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Forbidden" });
  });

  it("returns 404 missing application", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.tailoringSession.count.mockResolvedValue(1);

    const res = await request(app)
      .post("/feedback/application-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Application not found" });
  });

  it("returns 500 failed to retrieve application info", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "application-1",
      userId: "user-1",
    } as any);
    mockPrisma.tailoringSession.count.mockResolvedValue(1);
    mockApplicationInfo.mockResolvedValue(null);

    const res = await request(app)
      .post("/feedback/application-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      message: "Failed to retrieve application info",
    });
  });

  it("returns 404 missing resume", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "application-1",
      userId: "user-1",
    } as any);
    mockPrisma.tailoringSession.count.mockResolvedValue(1);
    mockApplicationInfo.mockResolvedValue([
      "Company: Company A",
      "Role: Teacher",
      "Status: APPLIED",
      "Applied Date: 31/03/26",
    ]);
    mockResumeText.mockResolvedValue(null);

    const res = await request(app)
      .post("/feedback/application-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Resume not found" });
  });

  it("returns 500 no suggestions", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "application-1",
      userId: "user-1",
    } as any);
    mockPrisma.tailoringSession.count.mockResolvedValue(1);
    mockApplicationInfo.mockResolvedValue([
      "Company: Company A",
      "Role: Teacher",
      "Status: APPLIED",
      "Applied Date: 31/03/26",
    ]);
    mockResumeText.mockResolvedValue("This is a test resume");
    mockResumeSuggestions.mockResolvedValue(null);

    const res = await request(app)
      .post("/feedback/application-1")
      .set("x-test-user-id", "user-1");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Failed to retrieve feedback" });
  });

  it("returns 201 success", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "application-1",
      userId: "user-1",
      company: "Company A",
      role: "Teacher",
    } as any);
    mockPrisma.tailoringSession.count.mockResolvedValue(1);
    mockApplicationInfo.mockResolvedValue([
      "Company: Company A",
      "Role: Teacher",
      "Status: APPLIED",
      "Applied Date: 31/03/26",
    ]);
    mockResumeText.mockResolvedValue("This is a test resume");
    mockResumeSuggestions.mockResolvedValue({
      miss: ["missing skill A", "missing skill B"],
      improve: ["improve X"],
      add: ["add certification Y"],
      weak: ["weak point Z"],
    });
    mockPrisma.tailoringSession.create.mockResolvedValue({
      id: "session-1",
      applicationId: "application-1",
      userId: "user-1",
      suggestions: "suggestions",
      status: "PENDING",
    } as any);

    const res = await request(app)
      .post("/feedback/application-1")
      .set("x-test-user-id", "user-1");
    expect(res.status).toBe(201);
    expect(mockLogAudit).toHaveBeenCalledWith(
      "user-1",
      "TAILORING_SESSION_CREATED",
      "Tailoring started for Company A - Teacher",
      "TailoringSession",
      "session-1",
    );
  });
});

describe("PATCH /feedback/update/:sessionId", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).patch("/feedback/update/session-1");
    expect(res.status).toBe(401);
  });

  it("returns 400 schema invalid", async () => {
    const res = await request(app)
      .patch("/feedback/update/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        acceptedSuggestions: ["miss-1", "miss-2"],
        dismissedSuggestions: ["miss-1"],
      });

    expect(res.status).toBe(400);
    expect(res.body["message"]).toEqual("Invalid request");
  });

  it("returns 403 wrong session owner", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      userId: "user-2",
    } as any);

    const res = await request(app)
      .patch("/feedback/update/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        acceptedSuggestions: ["miss-1", "miss-2"],
        dismissedSuggestions: ["miss-3"],
      });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Forbidden" });
  });

  it("returns 200 success", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
    } as any);
    mockPrisma.tailoringSession.update.mockResolvedValue({
      id: "session-1",
      status: "REVIEWED",
    } as any);

    const res = await request(app)
      .patch("/feedback/update/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        acceptedSuggestions: ["miss-1", "miss-2"],
        dismissedSuggestions: ["miss-3"],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Suggestions updated",
      status: "REVIEWED",
    });
    expect(mockLogAudit).toHaveBeenCalledWith(
      "user-1",
      "TAILORING_SUGGESTIONS_REVIEWED",
      "Accepted: 2, Dismissed: 1",
      "TailoringSession",
      "session-1",
    );
  });

  it("returns 500 failure", async () => {
    mockPrisma.tailoringSession.findUnique.mockRejectedValue(
      new Error("DB down"),
    );

    const res = await request(app)
      .patch("/feedback/update/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        acceptedSuggestions: ["miss-1", "miss-2"],
        dismissedSuggestions: ["miss-3"],
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error" });
  });
});

describe("POST /feedback/generate/:sessionId", () => {
  it("returns 401 no userId", async () => {
    const res = await request(app).post("/feedback/generate/session-1");
    expect(res.status).toBe(401);
  });

  it("returns 400 invalid resume name", async () => {
    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "new",
      });

    expect(res.status).toBe(400);
  });

  it("returns 404 tailoring session not found", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "new-resume",
      });
    expect(res.status).toBe(404);
  });

  it("returns 403 unauthorised session", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      userId: "user-2",
    } as any);

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "new-resume",
      });

    expect(res.status).toBe(403);
  });

  it("returns 400 no applicationID", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      userId: "user-1",
    } as any);

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "new-resume",
      });

    expect(res.status).toBe(400);
  });

  it("returns 200 user resume already exists", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      userId: "user-1",
      applicationId: "application-1",
    } as any);

    mockPrisma.tailoredResume.findFirst.mockResolvedValue({
      id: "new-resume-1",
    } as any);

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "new-resume",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toEqual("TAILORED");
  });

  it("returns 404 no resume", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      userId: "user-1",
      applicationId: "application-1",
    } as any);

    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);
    mockResumeText.mockResolvedValue(null);

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "new-resume",
      });

    expect(res.status).toBe(404);
  });

  it("returns 500 generation failure", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      userId: "user-1",
      applicationId: "application-1",
    } as any);

    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);
    mockResumeText.mockResolvedValue("Resume text");
    mockParseAcceptedSuggestions.mockReturnValue({
      miss: ["missing skill A", "missing skill B"],
      improve: ["improve X"],
      add: ["add certification Y"],
      weak: ["weak point Z"],
    });
    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);
    mockGenerateTailoredResume.mockResolvedValue(null);

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "A new resume",
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Failed to retrieve tailored resume" });
  });

  it("returns 500 on PDF conversion error", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      applicationId: "application-1",
    } as any);
    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);
    mockResumeText.mockResolvedValue("Resume text");
    mockParseAcceptedSuggestions.mockReturnValue({
      miss: ["missing skill A", "missing skill B"],
      improve: ["improve X"],
      add: ["add certification Y"],
      weak: ["weak point Z"],
    });
    mockGenerateTailoredResume.mockResolvedValue("Tailored resume text");
    mockConvertTextToPDF.mockRejectedValue(new Error("PDF conversion failed"));

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({ resumeName: "A new resume" });

    expect(res.status).toBe(500);
  });

  it("returns 500 on R2 upload error", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      applicationId: "application-1",
    } as any);

    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);
    mockResumeText.mockResolvedValue("Resume text");
    mockParseAcceptedSuggestions.mockReturnValue({
      miss: ["missing skill A", "missing skill B"],
      improve: ["improve X"],
      add: ["add certification Y"],
      weak: ["weak point Z"],
    });
    mockGenerateTailoredResume.mockResolvedValue("Tailored resume text");
    mockConvertTextToPDF.mockResolvedValue(Buffer.from("pdf-buffer"));
    mockR2Send.mockRejectedValue(new Error("Upload failed"));

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({ resumeName: "A new resume" });

    expect(res.status).toBe(500);
  });

  it("returns 500 on transaction failure and cleans up R2 object", async () => {
    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      applicationId: "application-1",
      acceptedSuggestions: ["miss-0"],
      suggestions: {
        miss: ["missing skill A"],
        improve: ["improve X"],
        add: ["add certification Y"],
        weak: ["weak point Z"],
      },
    } as any);

    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);
    mockResumeText.mockResolvedValue("Resume text");
    mockParseAcceptedSuggestions.mockReturnValue({
      miss: ["missing skill A", "missing skill B"],
      improve: ["improve X"],
      add: ["add certification Y"],
      weak: ["weak point Z"],
    });
    mockGenerateTailoredResume.mockResolvedValue("Tailored resume text");
    mockConvertTextToPDF.mockResolvedValue(Buffer.from("pdf-buffer"));
    // First call: R2 upload succeeds, second call: R2 delete for cleanup
    mockR2Send.mockResolvedValueOnce({} as any);
    mockR2Send.mockResolvedValueOnce({} as any);
    // Transaction fails
    mockPrisma.$transaction.mockRejectedValue(new Error("Transaction failed"));

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({ resumeName: "A new resume" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      message: "Unable to generate tailored resume",
    });
    // Assert R2 delete was called for cleanup
    expect(mockR2Send).toHaveBeenCalledTimes(2);
    const deleteCall = mockR2Send.mock.calls[1][0];
    expect(deleteCall.input).toHaveProperty("Key");
  });

  it("returns 201 resume generation success", async () => {
    const createdResume = {
      id: "tailored-resume-1",
      applicationId: "application-1",
      name: "A new resume",
    };
    const updatedSession = {
      status: "TAILORED",
    };

    mockPrisma.tailoringSession.findUnique.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      applicationId: "application-1",
      acceptedSuggestions: ["miss-0"],
      suggestions: {
        miss: ["missing skill A"],
        improve: ["improve X"],
        add: ["add certification Y"],
        weak: ["weak point Z"],
      },
    } as any);
    mockPrisma.tailoredResume.findFirst.mockResolvedValue(null);
    mockResumeText.mockResolvedValue("Resume text");
    mockParseAcceptedSuggestions.mockReturnValue({
      miss: ["missing skill A", "missing skill B"],
      improve: ["improve X"],
      add: ["add certification Y"],
      weak: ["weak point Z"],
    });
    mockGenerateTailoredResume.mockResolvedValue("Tailored resume text");
    mockConvertTextToPDF.mockResolvedValue(Buffer.from("pdf-buffer"));
    mockR2Send.mockResolvedValue({} as any);
    mockLogAudit.mockResolvedValue(undefined);
    mockPrisma.tailoredResume.create = jest
      .fn()
      .mockResolvedValue(createdResume);
    mockPrisma.tailoringSession.update.mockResolvedValue(updatedSession as any);
    mockPrisma.$transaction.mockResolvedValue([
      createdResume,
      updatedSession,
    ] as any);

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({
        resumeName: "A new resume",
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: "Resume created",
      applicationId: "application-1",
      tailoredResumeId: "tailored-resume-1",
      status: "TAILORED",
    });
    expect(mockLogAudit).toHaveBeenCalledWith(
      "user-1",
      "RESUME_TAILORED",
      "A new resume",
      "TailoredResume",
      "tailored-resume-1",
    );
  });

  it("returns 500 on session lookup error", async () => {
    mockPrisma.tailoringSession.findUnique.mockRejectedValue(
      new Error("DB down"),
    );

    const res = await request(app)
      .post("/feedback/generate/session-1")
      .set("x-test-user-id", "user-1")
      .send({ resumeName: "A new resume" });

    expect(res.status).toBe(500);
  });
});
