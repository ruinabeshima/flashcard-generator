import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "@clerk/express";

const applicationRouter = express.Router();

applicationRouter.get(
  "/",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;
    const pageNum = parseInt(req.query.pageNum as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
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
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

applicationRouter.post(
  "/add",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { role, company, status, appliedDate, notes, jobUrl } = req.body;

    try {
      const application = await prisma.application.create({
        data: {
          role: role,
          company: company,
          status: status,
          appliedDate: new Date(appliedDate),
          notes: notes ?? null,
          jobUrl: jobUrl ?? null,
          userId: userId,
        },
      });

      res.status(201).json(application);
    } catch {
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export { applicationRouter };
