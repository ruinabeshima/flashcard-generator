import express, { Request, Response } from "express";
import logAudit from "../lib/monitoring/audit";
import { requireAuth } from "@clerk/express";
import { logger } from "../lib/monitoring/logger";
import { prisma } from "../lib/prisma";
import {
  getApplicationInfo,
  getResumeText,
  getResumeSuggestions,
  generateTailoredResume,
  ResumeSuggestions,
} from "../lib/openai/openai";
import { parseAcceptedSuggestions } from "../lib/tailoring/tailoring";
import convertTextToPDF from "../lib/tailoring/convert";
import { r2 } from "../lib/storage/r2";
import { randomUUID } from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import * as z from "zod";

const MAX_TAILORING_SESSIONS = 3;

const feedbackRouter = express.Router();

// Start tailoring session, and retrieve AI suggestions
feedbackRouter.post(
  "/:applicationId",
  requireAuth(),
  async (req: Request<{ applicationId: string }>, res: Response) => {
    const { userId } = req.auth;
    const { applicationId } = req.params;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { endpoint: "/feedback" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
      });
      if (app?.userId !== userId) {
        logger.warn("Application does not belong to user", {
          userId,
          applicationId,
        });
        return res.status(403).json({ message: "Forbidden" });
      }

      // Retrieve user application
      const application: string[] | null = await getApplicationInfo(
        applicationId,
        userId,
      );
      if (!application) {
        logger.warn("Application does not exist", { applicationId, userId });
        return res.status(404).json({ message: "Application not found" });
      }

      // Retrieve resume text
      const resumeText: string | null = await getResumeText(userId);
      if (!resumeText) {
        logger.warn("Resume does not exist", { userId });
        return res.status(404).json({ message: "Resume not found" });
      }

      // Maximum 3 AI requests per user
      const sessionCount = await prisma.tailoringSession.count({
        where: { userId },
      });
      if (sessionCount >= MAX_TAILORING_SESSIONS) {
        return res.status(403).json({
          message: "You have reached the maximum of 3 tailoring sessions.",
          limit: MAX_TAILORING_SESSIONS,
        });
      }

      // Retrieve feedback
      const suggestions: ResumeSuggestions | null = await getResumeSuggestions(
        application,
        resumeText,
        userId,
      );
      if (!suggestions) {
        logger.warn("Feedback was not received", { userId });
        return res.status(500).json({ message: "Failed to retrieve feedback" });
      }

      // Create tailoring session
      const session = await prisma.tailoringSession.create({
        data: {
          applicationId,
          userId,
          suggestions,
          status: "PENDING",
        },
      });

      await logAudit(
        userId,
        "TAILORING_SESSION_CREATED",
        `Tailoring started for ${app.company} - ${app.role}`,
        "TailoringSession",
        session.id,
      );

      return res
        .status(201)
        .json({ sessionId: session.id, suggestions, status: session.status });
    } catch (error) {
      logger.error("Failed to process feedback request", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Update suggestion decisions, and track accepted / dismissed
const suggestionId = z
  .string()
  .regex(/^(miss|improve|add|weak)-\d+$/, "Invalid suggestion ID format");
const noDuplicates = (arr: string[]) => {
  return new Set(arr).size === arr.length;
};
const updateSuggestionsSchema = z
  .object({
    acceptedSuggestions: z.array(suggestionId),
    dismissedSuggestions: z.array(suggestionId),
  })
  .refine((data) => noDuplicates(data.acceptedSuggestions), {
    path: ["acceptedSuggestions"],
    message: "acceptedSuggestions contains duplicates",
  })
  .refine((data) => noDuplicates(data.dismissedSuggestions), {
    path: ["dismissedSuggestions"],
    message: "dismissedSuggestions contains duplicates",
  })
  .refine(
    (data) => {
      const acceptedSet = new Set(data.acceptedSuggestions);
      const duplicates = data.dismissedSuggestions.filter((item) =>
        acceptedSet.has(item),
      );
      return duplicates.length === 0;
    },
    {
      message: "Suggestions cannot be both accepted and dismissed",
    },
  )
  .strict();

feedbackRouter.post(
  "/update/:sessionId",
  requireAuth(),
  async (req: Request<{ sessionId: string }>, res: Response) => {
    const { userId } = req.auth;
    const { sessionId } = req.params;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: `/feedback/${sessionId}`,
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = updateSuggestionsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: z.treeifyError(result.error),
      });
    }
    const { acceptedSuggestions, dismissedSuggestions } = result.data;

    try {
      // Retrieve tailoring session and update with values
      const session = await prisma.tailoringSession.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (!session || session.userId !== userId) {
        logger.warn("Unauthorised access attempt", {
          endpoint: `/feedback/${sessionId}`,
        });
        return res.status(403).json({ message: "Forbidden" });
      }

      // Update tailoring session
      const updatedSession = await prisma.tailoringSession.update({
        where: {
          id: sessionId,
        },
        data: {
          acceptedSuggestions,
          dismissedSuggestions,
          status: "REVIEWED",
        },
      });

      await logAudit(
        userId,
        "TAILORING_SUGGESTIONS_REVIEWED",
        `Accepted: ${acceptedSuggestions.length}, Dismissed: ${dismissedSuggestions.length}`,
        "TailoringSession",
        session.id,
      );

      res.status(200).json({
        message: "Suggestions updated",
        status: updatedSession.status,
      });
    } catch (error) {
      logger.error("Failed to update suggestion decisions", { userId, error });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Generate tailored resume
const generateTailoredResumeSchema = z.object({
  resumeName: z.string().min(5).max(30).nullish(),
});
feedbackRouter.post(
  "/generate/:sessionId",
  requireAuth(),
  async (req: Request<{ sessionId: string }>, res: Response) => {
    const { userId } = req.auth;
    const { sessionId } = req.params;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: "/feedback/generate",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = generateTailoredResumeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: z.treeifyError(result.error),
      });
    }
    const { resumeName } = result.data;

    try {
      // Retrieve tailoring session and update status
      const session = await prisma.tailoringSession.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (!session || session.userId !== userId) {
        logger.warn("Unauthorised access attempt", {
          endpoint: `/feedback/${sessionId}`,
        });
        return res.status(403).json({ message: "Forbidden" });
      }

      // Retrieve resume text
      const resumeText: string | null = await getResumeText(userId);
      if (!resumeText) {
        logger.warn("Resume does not exist", { userId });
        return res.status(404).json({ message: "Resume not found" });
      }

      // Retrieve tailored resume
      const resumeSuggestions = parseAcceptedSuggestions(
        session.acceptedSuggestions,
        session.suggestions as ResumeSuggestions,
      );
      const tailoredContent = await generateTailoredResume(
        resumeText,
        resumeSuggestions,
        userId,
      );
      if (!tailoredContent) {
        logger.warn("Tailored resume content was not received", { userId });
        return res
          .status(500)
          .json({ message: "Failed to retrieve tailored resume" });
      }

      const dbResumeName =
        resumeName || `Resume - ${new Date().toLocaleDateString()}`;
      const key = `uploads/${randomUUID()}.pdf`;

      // Build PDF Buffer and send to R2
      const PDFBuffer = await convertTextToPDF(tailoredContent);
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: PDFBuffer,
          ContentType: "application/pdf",
        }),
      );

      try {
        const [newResume, updatedSession] = await prisma.$transaction([
          // Create tailored resume
          prisma.tailoredResume.create({
            data: {
              tailoringSessionId: session.id,
              applicationId: session.applicationId,
              userId,
              name: dbResumeName,
              content: tailoredContent,
              key,
            },
          }),

          // Update tailoring session
          prisma.tailoringSession.update({
            where: {
              id: sessionId,
            },
            data: {
              status: "TAILORED",
            },
          }),
        ]);

        try {
          await logAudit(
            userId,
            "RESUME_TAILORED",
            newResume.name,
            "TailoredResume",
            newResume.id,
          );
        } catch (error) {
          logger.warn("Audit log failed", { userId, error });
        }

        return res.status(201).json({
          message: "Resume created",
          applicationId: newResume.applicationId,
          tailoredResumeId: newResume.id,
          status: updatedSession.status,
        });
      } catch (error) {
        // Clean up R2 object if DB transaction fails
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
          }),
        );
        logger.warn("Unable to generate tailored resume", { userId, error });
        return res
          .status(500)
          .json({ message: "Unable to generate tailored resume" });
      }
    } catch (error) {
      logger.warn("Unable to generate tailored resume", { userId, error });
      return res
        .status(500)
        .json({ message: "Unable to generate tailored resume" });
    }
  },
);

export { feedbackRouter };
