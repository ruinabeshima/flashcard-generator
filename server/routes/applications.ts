import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "@clerk/express";
import { logger } from "../lib/monitoring/logger";
import logAudit from "../lib/monitoring/audit";
import * as z from "zod";

const applicationRouter = express.Router();

// Get paginated list of job applications
applicationRouter.get(
  "/",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { endpoint: "/applications" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
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
      logger.error("Failed to fetch applications", { userId, error });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Get singular job application
applicationRouter.get(
  "/:id",
  requireAuth(),
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req.auth;
    const { id } = req.params;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: "/applications/:id",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
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
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      logger.error("Failed to fetch application", { userId, error });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

const appliedDateSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string" && value.length === 16) {
    return `${value}:00`;
  }

  return value;
}, z.coerce.date().nullable());

// Create new job application
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
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: "/applications/add",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = newApplicationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: z.treeifyError(result.error),
      });
    }
    const { role, company, status, appliedDate, notes, jobUrl } = result.data;

    try {
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
      logger.error("Failed to add application", { userId, error });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Update job application
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
applicationRouter.patch(
  "/:id",
  requireAuth(),
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req.auth;
    const { id } = req.params;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: "/applications/:id",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = updateApplicationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: z.treeifyError(result.error),
      });
    }
    const { role, company, status, appliedDate, notes, jobUrl } = result.data;

    try {
      const existing = await prisma.application.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!existing) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
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
      logger.error("Failed to update application", { userId, error });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Delete job application
applicationRouter.delete(
  "/:id",
  requireAuth(),
  async (req: Request<{ id: string }>, res: Response) => {
    const { userId } = req.auth;
    const { id } = req.params;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        endpoint: "/applications/:id",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const existing = await prisma.application.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!existing) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (existing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
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
      logger.error("Failed to delete application", { userId, error });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { applicationRouter };
