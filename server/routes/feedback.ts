import express, { Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import { logger } from "../lib/monitoring/logger";
import { prisma } from "../lib/prisma";
import {
  getApplicationInfo,
  getResumeText,
  getTailoring,
} from "../lib/openai/openai";

// TODO: Implement audit log
import logAudit from "../lib/monitoring/audit";

interface TailoringFeedback {
  miss: string[];
  improve: string[];
  add: string[];
  weak: string[];
}

const feedbackRouter = express.Router();

feedbackRouter.post("/", requireAuth(), async (req: Request, res: Response) => {
  const { userId } = req.auth;
  const { applicationId } = req.body;

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

    const application: string[] | null = await getApplicationInfo(
      applicationId,
      userId,
    );
    if (!application) {
      logger.warn("Application does not exist", { applicationId, userId });
      return res.status(404).json({ message: "Application not found" });
    }

    const resumeText: string | null = await getResumeText(userId);
    if (!resumeText) {
      logger.warn("Resume does not exist", { userId });
      return res.status(404).json({ message: "Resume not found" });
    }

    const feedback: TailoringFeedback | null = await getTailoring(
      application,
      resumeText,
    );
    if (!feedback) {
      logger.warn("Feedback was not received", { userId });
      return res.status(404).json({ message: "Failed to retrieve feedback" });
    }

    return res.status(200).json({ feedback });
  } catch (error) {
    logger.error("Failed to process feedback request", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { feedbackRouter };
