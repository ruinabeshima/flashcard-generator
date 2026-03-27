import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "@clerk/express";
import { logger } from "../lib/monitoring/logger";
import logAudit from "../lib/monitoring/audit";

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

// Create new job application
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

    const { role, company, status, appliedDate, notes, jobUrl } = req.body;

    try {
      const application = await prisma.application.create({
        data: {
          role: role,
          company: company,
          status: status,
          appliedDate: appliedDate ? new Date(appliedDate) : undefined,
          notes: notes ?? null,
          jobUrl: jobUrl ?? null,
          userId: userId,
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

    const { role, company, status, appliedDate, notes, jobUrl } = req.body;

    try {
      const application = await prisma.application.update({
        where: {
          id: id,
        },
        data: {
          role: role,
          company: company,
          status: status,
          appliedDate: appliedDate ? new Date(appliedDate) : undefined,
          notes: notes ?? null,
          jobUrl: jobUrl ?? null,
          userId: userId,
        },
      });

      await logAudit(
        userId,
        "APPLICATION_UPDATED",
        undefined,
        "Application",
        id,
      );

      res.status(201).json(application);
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
      await prisma.application.delete({
        where: {
          id: id,
        },
      });

      await logAudit(
        userId,
        "APPLICATION_DELETED",
        undefined,
        "Application",
        id,
      );

      return res
        .status(204)
        .json({ message: "Application successfully deleted" });
    } catch (error) {
      logger.error("Failed to delete application", { userId, error });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { applicationRouter };
