import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "@clerk/express";
import { logger } from "../lib/logger";
import logAudit from "../lib/audit";

const authRouter = express.Router();

authRouter.get(
  "/status",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { for: "onboarding status" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const data = await prisma.user.findFirst({
        where: {
          clerkId: userId,
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

authRouter.patch(
  "/status",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { for: "onboarding status" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await prisma.user.update({
        where: {
          clerkId: userId,
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
