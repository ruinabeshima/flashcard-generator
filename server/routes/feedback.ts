import express, { Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import { logger } from "../lib/monitoring/logger";
import { prisma } from "../lib/prisma";
import {
  getApplicationInfo,
  getResumeText,
  getResumeSuggestions,
  ResumeSuggestions,
} from "../lib/openai/openai";

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
      // User authentication
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

      // Get user application
      const application: string[] | null = await getApplicationInfo(
        applicationId,
        userId,
      );
      if (!application) {
        logger.warn("Application does not exist", { applicationId, userId });
        return res.status(404).json({ message: "Application not found" });
      }

      // Get resume text
      const resumeText: string | null = await getResumeText(userId);
      if (!resumeText) {
        logger.warn("Resume does not exist", { userId });
        return res.status(404).json({ message: "Resume not found" });
      }

      // Generate feedback
      const suggestions: ResumeSuggestions | null = await getResumeSuggestions(
        application,
        resumeText,
        userId,
      );
      if (!suggestions) {
        logger.warn("Feedback was not received", { userId });
        return res.status(500).json({ message: "Failed to retrieve feedback" });
      }

      // Create new tailoring session
      const session = await prisma.tailoringSession.create({
        data: {
          applicationId,
          userId,
          suggestions,
        },
      });

      return res.status(201).json({ sessionId: session.id, suggestions });
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
      // Retrieve tailoring session
      const session = await prisma.tailoringSession.findUnique({
        where: {
          id: sessionId,
        },
      });
      if (!session || session?.userId !== userId) {
        logger.warn("Unauthorised access attempt", {
          endpoint: `/feedback/${sessionId}`,
        });
      }

      // Update session
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

      res
        .status(200)
        .json({ message: "Suggestions updated", session: updatedSession });
    } catch (error) {
      logger.error("Failed to update suggestion decisions", { userId, error });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { feedbackRouter };
