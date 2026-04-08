import express, { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { requireFirebaseAuth } from "../lib/firebase/middleware";
import { logger } from "../lib/monitoring/logger";
import logAudit from "../lib/monitoring/audit";
import { AppError } from "../lib/errors/AppError";
import { mutationLimiter } from "../lib/ratelimit/rateLimiter";

const authRouter = express.Router();

/**
 * @route POST /auth/sync
 * @desc Create or update the authenticated user in the database
 * @access Private
 *
 * @returns {200} {ok: true}
 * @returns {400} Missing user info
 * @returns {401} Unauthorized
 * @returns {500} Internal server error
 */
authRouter.post(
  "/sync",
  mutationLimiter,
  requireFirebaseAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, email, imageUrl } = req.auth;

    try {
      if (!userId || !email) {
        throw new AppError(400, "Missing user info");
      }

      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email,
          imageUrl: imageUrl ?? null,
        },
        update: {
          email,
          imageUrl: imageUrl ?? null,
        },
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to sync user", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route GET /auth/status
 * @desc Get user's onboarding status
 * @access Private
 *
 * @returns {200} {onboardingComplete}
 * @returns {401} Unauthorized
 * @returns {404} User not found
 * @returns {500} Internal server error
 */
authRouter.get(
  "/status",
  mutationLimiter,
  requireFirebaseAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: "GET /auth/status",
        });
        throw new AppError(401, "Unauthorized");
      }

      const data = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          onboarding_complete: true,
        },
      });

      if (!data) {
        logger.warn("Failed to get user data", { userId });
        throw new AppError(404, "User not found");
      }

      return res
        .status(200)
        .json({ onboardingComplete: data.onboarding_complete });
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to get onboarding status", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route PATCH /auth/status
 * @desc Update user's onboarding status
 * @access Private
 *
 * @returns {200} { message: "Onboarding status updated successfully" }
 * @returns {401} Unauthorized
 * @returns {404} User not found
 * @returns {500} Internal server error
 */
authRouter.patch(
  "/status",
  requireFirebaseAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: "PATCH /auth/status",
        });
        throw new AppError(401, "Unauthorized");
      }

      // P2025 (record not found) error handled centrally
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          onboarding_complete: true,
        },
      });

      await logAudit(userId, "ONBOARDING_COMPLETED", undefined, "User", userId);

      return res
        .status(200)
        .json({ message: "Onboarding status updated successfully" });
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to update onboarding status", { userId, error });
      }
      next(error);
    }
  },
);

export { authRouter };
