import express, { Request, Response } from "express";
import { requireFirebaseAuth } from "../lib/firebase/middleware";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/monitoring/logger";

const tailoringRouter = express.Router();

/**
 * @route GET /tailoring/status/:applicationId
 * @desc Retrieve tailoring session status for an application
 * @access Private
 *
 * @param {string} applicationId - Application ID
 *
 * @returns {200} { status: "NONE", message }
 * @returns {200} { status: "PENDING" | "REVIEWED", sessionId, suggestions }
 * @returns {200} { status: "TAILORED", sessionId, tailoredResumeId, key }
 * @returns {401} Unauthorized
 * @returns {404} Tailored resume not found
 * @returns {500} Internal server error
 */
tailoringRouter.get(
  "/status/:applicationId",
  requireFirebaseAuth(),
  async (req: Request<{ applicationId: string }>, res: Response) => {
    const { userId } = req.auth;
    const { applicationId } = req.params;

    if (!userId) {
      logger.warn("Unauthorized access attempt", {
        endpoint: `/tailoring/status/${applicationId}`,
      });
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
        });
      }
    } catch (error) {
      logger.error("Failed to retreive tailoring status", { userId, error });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

/**
 * @route GET /tailoring/count
 * @desc Retrieve count of user's tailoring sessions
 * @access Private
 *
 * @returns {200} { count }
 * @returns {401} Unauthorized
 * @returns {500} Internal server error
 */
tailoringRouter.get(
  "/count",
  requireFirebaseAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorized access attempt", {
        endpoint: `/tailoring/count`,
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const count = await prisma.tailoringSession.count({
        where: { userId },
      });

      return res.status(200).json({ count });
    } catch (error) {
      logger.error("Failed to retrieve tailoring session count", {
        userId,
        error,
      });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { tailoringRouter };
