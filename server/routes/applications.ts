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
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export { applicationRouter };
