import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "@clerk/express";

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

export { authRouter };
