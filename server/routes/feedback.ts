import express, { NextFunction, Request, Response } from "express";
import logAudit from "../lib/monitoring/audit";
import { requireFirebaseAuth } from "../lib/firebase/middleware";
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
import { AppError } from "../lib/errors/AppError";

const MAXIMUM_FEEDBACK_COUNT = 3;

const feedbackRouter = express.Router();

/**
 * @route POST /feedback/:applicationId
 * @desc Generate AI suggestions and create a tailoring session (max 3 per user)
 * @access Private
 *
 * @param {string} applicationId - Application Id
 *
 * @returns {201} {sessionId, suggestions, status}
 * @returns {401} Unauthorized
 * @returns {403} Forbidden | Maximum number of requests reached
 * @returns {404} Application not found | Resume not found
 * @returns {500} Internal server error
 */
feedbackRouter.post(
  "/:applicationId",
  requireFirebaseAuth(),
  async (
    req: Request<{ applicationId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { userId } = req.auth;
    const { applicationId } = req.params;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", { endpoint: "/feedback" });
        throw new AppError(401, "Unauthorized");
      }

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
      });
      if (!app) {
        logger.warn("Application not found", {
          userId,
          applicationId,
        });
        throw new AppError(404, "Application not found");
      }
      if (app.userId !== userId) {
        logger.warn("Application does not belong to user", {
          userId,
          applicationId,
        });
        throw new AppError(403, "Forbidden");
      }

      // Check if user has enough tailoring sessions left
      const count = await prisma.tailoringSession.count({
        where: { userId },
      });
      if (count >= MAXIMUM_FEEDBACK_COUNT) {
        logger.warn("Maximum number of requests reached", {
          userId,
          applicationId,
        });
        throw new AppError(403, "Maximum number of requests reached");
      }

      // Retrieve user application
      const application: string[] | null = await getApplicationInfo(
        applicationId,
        userId,
      );
      if (!application) {
        logger.warn("Failed to retrieve application info", {
          applicationId,
          userId,
        });
        throw new AppError(500, "Failed to retrieve application info");
      }

      // Retrieve resume text
      const resumeText: string | null = await getResumeText(userId);
      if (!resumeText) {
        logger.warn("Resume does not exist", { userId });
        throw new AppError(404, "Resume not found");
      }

      // Retrieve AI feedback
      const suggestions: ResumeSuggestions | null = await getResumeSuggestions(
        application,
        resumeText,
        userId,
      );
      if (!suggestions) {
        logger.warn("Feedback was not received", { userId });
        throw new AppError(500, "Failed to retrieve feedback");
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
      if (!(error instanceof AppError)) {
        logger.error("Failed to process feedback request", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route PATCH /feedback/update/:sessionId
 * @desc Update tailoring session with accepted and dismissed suggestions
 * @access Private
 *
 * @param {string} sessionId - Tailoring session ID
 *
 * @body {string[]} acceptedSuggestions
 * @body {string[]} dismissedSuggestions
 *
 * @returns {200} { message: "Suggestions updated", status }
 * @returns {400} Invalid request body
 * @returns {401} Unauthorized
 * @returns {403} Forbidden
 * @returns {404} Tailoring session not found
 * @returns {500} Internal server error
 */
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

feedbackRouter.patch(
  "/update/:sessionId",
  requireFirebaseAuth(),
  async (
    req: Request<{ sessionId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { userId } = req.auth;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: ` PATCH /feedback/${sessionId}`,
        });
        throw new AppError(401, "Unauthorized");
      }

      const result = updateSuggestionsSchema.safeParse(req.body);
      if (!result.success) {
        throw result.error;
      }
      const { acceptedSuggestions, dismissedSuggestions } = result.data;

      // Retrieve tailoring session
      const session = await prisma.tailoringSession.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (!session) {
        logger.warn("Tailoring session not found", { userId, sessionId });
        throw new AppError(404, "Tailoring session not found");
      }
      if (session.userId !== userId) {
        logger.warn("Unauthorised access attempt", {
          endpoint: `/feedback/${sessionId}`,
        });
        throw new AppError(403, "Forbidden");
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
      if (!(error instanceof AppError)) {
        logger.error("Failed to update suggestion decisions", {
          userId,
          error,
        });
      }
      next(error);
    }
  },
);

/**
 * @route POST /feedback/generate/:sessionId
 * @desc Generate a tailored resume for a given tailoring session
 * @access Private
 *
 * @body {string} [resumeName]
 *
 * @returns {200} Resume already generated
 * @returns {201} Resume successfully generated
 * @returns {400} Invalid request body
 * @returns {401} Unauthorized
 * @returns {403} Forbidden
 * @returns {404} Tailoring session not found | Resume not found
 * @returns {500} Internal server error
 */
const generateTailoredResumeSchema = z.object({
  resumeName: z.string().min(5).max(30).nullish(),
});
feedbackRouter.post(
  "/generate/:sessionId",
  requireFirebaseAuth(),
  async (
    req: Request<{ sessionId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { userId } = req.auth;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: "/feedback/generate",
        });
        throw new AppError(401, "Unauthorized");
      }

      const result = generateTailoredResumeSchema.safeParse(req.body);
      if (!result.success) {
        throw result.error;
      }
      const { resumeName } = result.data;

      // Retrieve tailoring session and update status
      const session = await prisma.tailoringSession.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (!session) {
        logger.warn("Tailored session not found", { userId, sessionId });
        throw new AppError(404, "Tailoring session not found");
      }
      if (session.userId !== userId) {
        logger.warn("Unauthorised access attempt", {
          endpoint: `/feedback/${sessionId}`,
        });
        throw new AppError(403, "Forbidden");
      }

      // Ensure application ID exists before creating resume
      if (!session.applicationId) {
        logger.warn("Tailoring session missing application ID", {
          sessionId,
          userId,
        });
        throw new AppError(
          400,
          "Invalid tailoring session: application ID missing",
        );
      }

      // Check if user resume already exists for idempotency
      const existingResume = await prisma.tailoredResume.findFirst({
        where: { tailoringSessionId: sessionId },
      });
      if (existingResume) {
        return res.status(200).json({
          message: "Resume already generated",
          applicationId: existingResume.applicationId,
          tailoredResumeId: existingResume.id,
          status: "TAILORED",
        });
      }

      // Retrieve resume text
      const resumeText: string | null = await getResumeText(userId);
      if (!resumeText) {
        logger.warn("Resume does not exist", { userId });
        throw new AppError(404, "Resume not found");
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
        throw new AppError(500, "Failed to retrieve tailored resume");
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

        await logAudit(
          userId,
          "RESUME_TAILORED",
          newResume.name,
          "TailoredResume",
          newResume.id,
        );

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
        throw new AppError(500, "Unable to generate tailored resume");
      }
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Unable to generate tailored resume", { userId, error });
      }
      next(error);
    }
  },
);

export { feedbackRouter };
