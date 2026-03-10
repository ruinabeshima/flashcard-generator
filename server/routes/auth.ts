import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "@clerk/express";
import logAudit from "../lib/audit";

const authRouter = express.Router();

authRouter.get(
  "/status",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    try {
      const data = await prisma.user.findFirst({
        where: {
          clerkId: userId,
        },
        select: {
          onboarding_complete: true,
        },
      });

      return res
        .status(200)
        .json({ onboardingComplete: data?.onboarding_complete });
    } catch {
      return res.status(500).json({ message: "Failed to fetch status" });
    }
  },
);

authRouter.patch(
  "/status",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

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
        undefined,
        undefined,
      );

      return res
        .status(200)
        .json({ message: "Onboarding status updated successfully" });
    } catch {
      return res.status(500).json({ message: "Failed to update status" });
    }
  },
);

export { authRouter };
