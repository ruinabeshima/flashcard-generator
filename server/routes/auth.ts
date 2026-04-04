import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireFirebaseAuth } from "../lib/firebase/middleware";
import { logger } from "../lib/monitoring/logger";
import logAudit from "../lib/monitoring/audit";

const authRouter = express.Router();

// Check user's onboarding status
authRouter.get(
  "/status",
  requireFirebaseAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { for: "onboarding status" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const data = await prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          onboarding_complete: true,
        },
      });

      if (!data) {
        logger.warn("Failed to get user data", { userId });
        return res.status(404).json({ message: "User not found" });
      }

      return res
        .status(200)
        .json({ onboardingComplete: data?.onboarding_complete });
    } catch (error) {
      logger.error("Failed to get onboarding status", { userId, error });
      return res.status(500).json({ message: "Failed to fetch status" });
    }
  },
);

// Update user's onboarding status
authRouter.patch(
  "/status",
  requireFirebaseAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { for: "onboarding status" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          onboarding_complete: true,
        },
      });

      await logAudit(
        userId!,
        "ONBOARDING_COMPLETED",
        undefined,
        "User",
        userId,
      );

      return res
        .status(200)
        .json({ message: "Onboarding status updated successfully" });
    } catch (error) {
      logger.error("Failed to update onboarding status", { userId, error });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { authRouter };
