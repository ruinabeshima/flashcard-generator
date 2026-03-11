import express, { Request, Response } from "express";
import { requireAuth } from "@clerk/express";
import { logger } from "../lib/monitoring/logger";
import {
  getApplicationInfo,
  getResumeText,
  getTailoring,
} from "../lib/openai/openai";

// TODO: Implement audit log
import logAudit from "../lib/monitoring/audit";

const feedbackRouter = express.Router();

feedbackRouter.post("/", requireAuth(), async (req: Request, res: Response) => {
  const { userId } = req.auth;
  const { applicationId } = req.body;

  if (!userId) {
    logger.warn("Unauthorised access attempt", { endpoint: "/feedback" });
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
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

    const feedback = await getTailoring(application, resumeText);
    if (!feedback) {
      logger.warn("Feedback was not received", { userId });
      return res.status(404).json({ message: "Failed to retreive feedback" });
    }

    return res.status(200).json({ feedback });
  } catch (error) {
    logger.error("Failed to carry out OpenAPI request", { userId, error });
    return res.status(500).json({ message: "Internal server error" });
  }
});

export { feedbackRouter };
