import express, { Request, Response } from "express";
import { requireFirebaseAuth } from "../lib/firebase/middleware";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/monitoring/logger";

const tailoringRouter = express.Router();

// Check if tailoring session exists, and return null, suggestions or tailored resume key
tailoringRouter.get(
  "/status/:applicationId",
  requireFirebaseAuth(),
  async (req: Request<{ applicationId: string }>, res: Response) => {
    const { userId } = req.auth;
    const { applicationId } = req.params;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { endpoint: "/feedback" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const session = await prisma.tailoringSession.findFirst({
        where: { userId, applicationId },
      });
      if (!session) {
        return res
          .status(200)
          .json({ status: "NONE", message: "Resume has not been tailored" });
      }

      if (session.status === "PENDING" || session.status === "REVIEWED") {
        return res.status(200).json({
          status: session.status,
          sessionId: session.id,
          suggestions: session.suggestions,
        });
      }

      if (session.status === "TAILORED") {
        const tailoredResume = await prisma.tailoredResume.findFirst({
          where: {
            userId,
            applicationId,
          },
          select: {
            id: true,
            key: true,
          },
        });

        if (!tailoredResume) {
          return res
            .status(404)
            .json({ message: "Tailored resume key not found" });
        }

        return res.status(200).json({
          status: session.status,
          sessionId: session.id,
          tailoredResumeId: tailoredResume.id,
          key: tailoredResume.key,
        });
      }
    } catch (error) {
      logger.error({ userId, error });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { tailoringRouter };
