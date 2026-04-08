import express, { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireFirebaseAuth } from "../lib/firebase/middleware";
import { logger } from "../lib/monitoring/logger";
import logAudit from "../lib/monitoring/audit";
import { AppError } from "../lib/errors/AppError";
import * as z from "zod";
import { mutationLimiter } from "../lib/ratelimit/rateLimiter";

const applicationRouter = express.Router();

/* 
  HTML from frontend sends a string like "2026-04-08T10:30" (16 characters, no seconds)
  Some environments (Prisma) require full ISO timestamps, so we normalise by adding seconds. 

  This function: 
  - Converts empty values (null, undefined, "") to null 
  - Appends ":00" to strings missing seconds 
  - Leaves other values unchanged

  String is converted to a JS Date Object through z.coerce.date()
*/
const appliedDateSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string" && value.length === 16) {
    return `${value}:00`;
  }

  return value;
}, z.coerce.date().nullable());

/**
 * @route GET /applications
 * @desc Get paginated list of user's applications
 * @access Private
 *
 * @query {number} [pageNum=1]   - Page number
 * @query {number} [pageSize=10] - Number of results per page
 *
 * @returns {200} {id, role, company, status, appliedDate, notes, jobUrl}[]
 * @returns {401} Unauthorized
 * @returns {500} Internal server error
 */
applicationRouter.get(
  "/",
  requireFirebaseAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth;
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: "GET /applications",
        });
        throw new AppError(401, "Unauthorized");
      }

      const applications = await prisma.application.findMany({
        where: { userId: userId },
        select: {
          id: true,
          role: true,
          company: true,
          status: true,
          appliedDate: true,
          notes: true,
          jobUrl: true,
        },
        take: pageSize,
        skip: (pageNum - 1) * pageSize,
        orderBy: { appliedDate: "desc" },
      });

      res.json(applications);
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to fetch applications", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route GET /applications/:id
 * @desc Get singular job application
 * @access Private
 *
 * @param {string} id - Application ID
 *
 * @returns {200} {id, role, company, status, appliedDate, notes, jobUrl}
 * @returns {401} Unauthorized
 * @returns {404} Application not found
 * @returns {500} Internal server error
 */
applicationRouter.get(
  "/:id",
  requireFirebaseAuth(),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { userId } = req.auth;
    const { id } = req.params;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: `GET /applications/${id}`,
        });
        throw new AppError(401, "Unauthorized");
      }

      const application = await prisma.application.findUnique({
        where: {
          id: id,
          userId: userId,
        },
        select: {
          id: true,
          role: true,
          company: true,
          status: true,
          appliedDate: true,
          notes: true,
          jobUrl: true,
        },
      });

      if (!application) {
        logger.warn("Application not found", { userId, applicationId: id });
        throw new AppError(404, "Application not found");
      }

      res.json(application);
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to fetch application", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route POST /applications/add
 * @desc Add new job application
 * @access Private
 *
 * @body {string} role
 * @body {string} company
 * @body {"APPLIED" |"INTERVIEW" | "OFFER" | "REJECTED"} status
 * @body {datetime} [appliedDate]
 * @body {string} [notes]
 * @body {string} [jobUrl]
 *
 * @returns {201} {id, role, company, status, appliedDate, notes, jobUrl, userId, createdAt, updatedAt}
 * @returns {400} Invalid request body
 * @returns {401} Unauthorized
 * @returns {500} Internal server error
 *
 */
const newApplicationSchema = z
  .object({
    role: z.string().min(1).max(100),
    company: z.string().min(1).max(100),
    status: z.enum(["APPLIED", "INTERVIEW", "OFFER", "REJECTED"]),
    appliedDate: appliedDateSchema,
    notes: z.string().nullish(),
    jobUrl: z.url().nullish(),
  })
  .strict();
applicationRouter.post(
  "/add",
  mutationLimiter,
  requireFirebaseAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: "POST /applications/add",
        });
        throw new AppError(401, "Unauthorized");
      }

      const result = newApplicationSchema.safeParse(req.body);
      if (!result.success) {
        throw result.error;
      }
      const { role, company, status, appliedDate, notes, jobUrl } = result.data;

      const application = await prisma.application.create({
        data: {
          role,
          company,
          status,
          appliedDate: appliedDate ?? undefined,
          notes: notes ?? null,
          jobUrl: jobUrl ?? null,
          userId,
        },
      });

      await logAudit(
        userId,
        "APPLICATION_CREATED",
        undefined,
        "Application",
        application.id,
      );

      res.status(201).json(application);
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to create application", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route PUT /applications/:id
 * @desc Update application details
 * @access Private
 *
 * @param {string} id - Application ID
 *
 * @body {string} role
 * @body {string} company
 * @body {"APPLIED" |"INTERVIEW" | "OFFER" | "REJECTED"} status
 * @body {datetime} appliedDate
 * @body {string} notes
 * @body {string} jobUrl
 *
 * @returns {200} {id, role, company, status, appliedDate, notes, jobUrl, userId, createdAt, updatedAt}
 * @returns {400} Invalid request body
 * @returns {401} Unauthorized
 * @returns {403} Forbidden
 * @returns {404} Application not found
 * @returns {500} Internal server error
 */
const updateApplicationSchema = z
  .object({
    role: z.string().min(1).max(100),
    company: z.string().min(1).max(100),
    status: z.enum(["APPLIED", "INTERVIEW", "OFFER", "REJECTED"]),
    appliedDate: appliedDateSchema,
    notes: z.string().nullish(),
    jobUrl: z.url().nullish(),
  })
  .strict();
applicationRouter.put(
  "/:id",
  mutationLimiter,
  requireFirebaseAuth(),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { userId } = req.auth;
    const { id } = req.params;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: `PUT /applications/${id}`,
        });
        throw new AppError(401, "Unauthorized");
      }

      const result = updateApplicationSchema.safeParse(req.body);
      if (!result.success) {
        throw result.error;
      }
      const { role, company, status, appliedDate, notes, jobUrl } = result.data;

      const existing = await prisma.application.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!existing) {
        logger.warn("Application not found", { userId, applicationId: id });
        throw new AppError(404, "Application not found");
      }

      if (existing.userId !== userId) {
        logger.warn("Unauthorized access attempt", { userId });
        throw new AppError(403, "Forbidden");
      }

      const updated = await prisma.application.update({
        where: {
          id,
        },
        data: {
          role,
          company,
          status,
          appliedDate: appliedDate ?? undefined,
          notes: notes ?? null,
          jobUrl: jobUrl ?? null,
          userId,
        },
      });

      await logAudit(
        userId,
        "APPLICATION_UPDATED",
        undefined,
        "Application",
        id,
      );

      res.status(200).json(updated);
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to update application", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route DELETE /applications/:id
 * @desc Delete application
 * @access Private
 *
 * @param {string} id - Application ID
 *
 * @returns {204} Application deleted
 * @returns {401} Unauthorized
 * @returns {403} Forbidden
 * @returns {404} Application not found
 * @returns {500} Internal server error
 */
applicationRouter.delete(
  "/:id",
  mutationLimiter,
  requireFirebaseAuth(),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { userId } = req.auth;
    const { id } = req.params;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          endpoint: `DELETE /applications/${id}`,
        });
        throw new AppError(401, "Unauthorized");
      }

      const existing = await prisma.application.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!existing) {
        logger.warn("Application not found", { userId, applicationId: id });
        throw new AppError(404, "Application not found");
      }

      if (existing.userId !== userId) {
        logger.warn("Unauthorized access attempt", { userId });
        throw new AppError(403, "Forbidden");
      }

      await prisma.application.delete({
        where: {
          id,
        },
      });

      await logAudit(
        userId,
        "APPLICATION_DELETED",
        undefined,
        "Application",
        id,
      );

      return res.sendStatus(204);
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to delete application", { userId, error });
      }
      next(error);
    }
  },
);

export { applicationRouter };
