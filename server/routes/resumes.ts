import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { r2 } from "../lib/storage/r2";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { upload } from "../lib/storage/multer";
import { requireAuth } from "@clerk/express";
import { randomUUID } from "crypto";
import { logger } from "../lib/monitoring/logger";
import logAudit from "../lib/monitoring/audit";
import parsePDF from "../lib/storage/parse";

const resumeRouter = express.Router();

// Get URL of user's resume
resumeRouter.get("/", requireAuth(), async (req: Request, res: Response) => {
  const { userId } = req.auth;

  if (!userId) {
    logger.warn("Unauthorised access attempt", { route: "/your-resume" });
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const resume = await prisma.resume.findUnique({
      where: {
        userId: userId,
      },
      select: {
        key: true,
      },
    });

    if (!resume) {
      logger.warn("Resume not found", { userId });
      return res.status(404).json({ message: "Resume not found" });
    }

    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: resume.key,
      }),
      { expiresIn: 3600 },
    );

    res.json({ url });
  } catch (error) {
    logger.error("Failed to retrieve resume", { userId, error });
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all user's tailored resumes
resumeRouter.get(
  "/tailored",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        route: "/resumes/tailored",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const resumes = await prisma.tailoredResume.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          name: true,
          applicationId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({ resumes });
    } catch (error) {
      logger.error("Failed to retrieve resume", { userId, error });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Get individual tailored resume url
resumeRouter.get(
  "/tailored/:tailoredResumeId",
  requireAuth(),
  async (req: Request<{ tailoredResumeId: string }>, res: Response) => {
    const { tailoredResumeId } = req.params;
    const { userId } = req.auth;

    if (!userId) {
      logger.warn("Unauthorised access attempt", {
        route: "/resumes/tailored",
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const tailoredResume = await prisma.tailoredResume.findFirst({
        where: {
          id: tailoredResumeId,
          userId,
        },
        select: {
          key: true,
        },
      });

      if (!tailoredResume) {
        return res.status(404).json({ message: "Tailored resume not found" });
      }

      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: tailoredResume.key,
        }),
        { expiresIn: 3600 },
      );

      res.json({ url });
    } catch (error) {
      logger.error("Failed to retrieve tailored resume", { userId, error });
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Upload / update resume
resumeRouter.post(
  "/upload",
  requireAuth(),
  upload.single("file"),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;
    const { file } = req;

    if (!userId) {
      logger.warn("Unauthorised access attempt", { route: "/your-resume" });
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!file) {
      logger.warn("No file uploaded", { userId, route: "your-resume" });
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = file.originalname.split(".").pop();
    const key = `uploads/${randomUUID()}.${ext}`;

    try {
      const existing = await prisma.resume.findUnique({
        where: {
          userId: userId,
        },
        select: {
          key: true,
        },
      });

      if (existing) {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: existing.key,
          }),
        );
      }

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const text = await parsePDF(file.buffer);
      if (!text) {
        logger.error("Failed to parse PDF", { userId });
        return res.status(400).json({ message: "Failed to parse resume" });
      }

      const resume = await prisma.resume.upsert({
        where: {
          userId: userId,
        },
        update: {
          key,
          text,
        },
        create: {
          key: key!,
          userId: userId!,
          text,
        },
      });

      await logAudit(
        userId!,
        "RESUME_UPLOADED",
        existing ? "Resume replaced" : "Initial upload",
        "Resume",
        resume.id,
      );

      res
        .status(201)
        .json({ id: resume.id, message: "File sent successfully" });
    } catch (error) {
      logger.error("Failed to upload file", { userId, error });
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export { resumeRouter };
