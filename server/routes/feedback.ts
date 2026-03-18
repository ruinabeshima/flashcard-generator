import express, { Request, Response } from "express";
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
feedbackRouter.post(
  "/update/:sessionId",
  requireAuth(),
  async (req: Request<{ sessionId: string }>, res: Response) => {
    const { userId } = req.auth;
    const { sessionId } = req.params;
    const { acceptedSuggestions, dismissedSuggestions } = req.body;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: `/feedback/${sessionId}`,
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Retrieve tailoring session and update with values
      const session = await prisma.tailoringSession.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (!session || session?.userId !== userId) {
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
feedbackRouter.post(
  "/generate/:sessionId",
  requireAuth(),
  async (req: Request<{ sessionId: string }>, res: Response) => {
    const { userId } = req.auth;
    const { sessionId } = req.params;
    const { resumeName } = req.body;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: "/feedback/generate",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Retrieve tailoring session and update status
      const session = await prisma.tailoringSession.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (!session || session?.userId !== userId) {
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

      // Create tailored resume
      const newResume = await prisma.tailoredResume.create({
        data: {
          tailoringSessionId: session.id,
          applicationId: session.applicationId,
          userId,
          name: resumeName || `New resume - ${userId}`,
          content: tailoredContent,
        },
      });

      // Update tailoring session
      const updatedSession = await prisma.tailoringSession.update({
        where: {
          id: sessionId,
        },
        data: {
          status: "TAILORED",
        },
      });

      return res.status(201).json({
        message: "Resume created",
        name: newResume.name,
        resume: newResume.content,
        status: updatedSession.status,
      });
    } catch (error) {
      logger.warn("Unable to generate tailored resume", { userId, error });
      return res
        .status(500)
        .json({ message: "Unable to generate tailored resume" });
    }
  },
);

export { feedbackRouter };
