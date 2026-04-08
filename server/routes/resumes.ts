import express, { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { r2 } from "../lib/storage/r2";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { upload } from "../lib/storage/multer";
import { requireFirebaseAuth } from "../lib/firebase/middleware";
import { randomUUID } from "crypto";
import { logger } from "../lib/monitoring/logger";
import logAudit from "../lib/monitoring/audit";
import parsePDF from "../lib/storage/parse";
import { AppError } from "../lib/errors/AppError";

const resumeRouter = express.Router();

/**
 * @route GET /resumes
 * @desc Retrieve URL of user's resume
 * @access Private
 *
 * @returns {200} { url }
 * @returns {401} Unauthorized
 * @returns {404} Resume URL not found
 * @returns {500} Internal server error
 */
resumeRouter.get(
  "/",
  requireFirebaseAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", { route: "/your-resume" });
        throw new AppError(401, "Unauthorized");
      }

      const resume = await prisma.resume.findUnique({
        where: {
          userId: userId,
        },
        select: {
          key: true,
        },
      });

      if (!resume) {
        logger.warn("Resume URL not found", { userId });
        throw new AppError(404, "Resume URL not found");
      }

      // Retrieve URL from R2 bucket
      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: resume.key,
        }),
        { expiresIn: 300 },
      );

      res.json({ url });
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to retrieve resume", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route GET /resumes/tailored
 * @desc Retrieve all user's tailored resumes
 * @access Private
 *
 * @returns {200} { id, name, applicationId, createdAt }[]
 * @returns {401} Unauthorized
 * @returns {500} Internal server error
 */
resumeRouter.get(
  "/tailored",
  requireFirebaseAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          route: "/resumes/tailored",
        });
        throw new AppError(401, "Unauthorized");
      }

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
      if (!(error instanceof AppError)) {
        logger.error("Failed to retrieve resume", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route GET /resumes/tailored/:tailoredResumeId
 * @desc Retrieve URL of individual tailored resume
 * @access Private
 *
 * @param {string} tailoredResumeId - Tailored resume ID
 *
 * @returns {200} { url }
 * @returns {401} Unauthorized
 * @returns {404} Tailored resume not found
 * @returns {500} Internal server error
 */
resumeRouter.get(
  "/tailored/:tailoredResumeId",
  requireFirebaseAuth(),
  async (
    req: Request<{ tailoredResumeId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { tailoredResumeId } = req.params;
    const { userId } = req.auth;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", {
          route: "/resumes/tailored",
        });
        throw new AppError(401, "Unauthorized");
      }

      // Retrieve PDF key
      const tailoredResume = await prisma.tailoredResume.findUnique({
        where: {
          id: tailoredResumeId,
          userId,
        },
        select: {
          key: true,
        },
      });

      if (!tailoredResume) {
        logger.warn("Tailored resume not found", { userId, tailoredResumeId });
        throw new AppError(404, "Tailored resume not found");
      }

      // Retrieve URL from R2 bucket
      const url = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: tailoredResume.key,
        }),
        { expiresIn: 300 },
      );

      res.json({ url });
    } catch (error) {
      if (!(error instanceof AppError)) {
        logger.error("Failed to retrieve tailored resume", { userId, error });
      }
      next(error);
    }
  },
);

/**
 * @route POST /resumes/upload
 * @desc Upload or update resume
 * @access Private
 *
 * @returns {201} { id, message: "File sent successfully" }
 * @returns {400} No file uploaded | File must be a valid PDF | Failed to parse resume
 * @returns {401} Unauthorized
 * @returns {500} Internal server error
 */
resumeRouter.post(
  "/upload",
  requireFirebaseAuth(),
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.auth;
    const { file } = req;
    let uploadedKey: string | null = null;
    let dbSaved = false;

    try {
      if (!userId) {
        logger.warn("Unauthorized access attempt", { route: "/your-resume" });
        throw new AppError(401, "Unauthorized");
      }

      if (!file) {
        logger.warn("No file uploaded", { userId, route: "your-resume" });
        throw new AppError(400, "No file uploaded");
      }

      // Validate file contents
      const isPDF = file.buffer.slice(0, 4).toString() === "%PDF";
      if (!isPDF) {
        throw new AppError(400, "File must be a valid PDF");
      }

      const ext = file.originalname.split(".").pop();
      const key = `uploads/${randomUUID()}.${ext}`;

      const existing = await prisma.resume.findUnique({
        where: {
          userId: userId,
        },
        select: {
          key: true,
        },
      });

      const text = await parsePDF(file.buffer);
      if (!text) {
        logger.error("Failed to parse PDF", { userId });
        throw new AppError(400, "Failed to parse resume");
      }

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      uploadedKey = key;

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
      dbSaved = true;

      await logAudit(
        userId!,
        "RESUME_UPLOADED",
        existing ? "Resume replaced" : "Initial upload",
        "Resume",
        resume.id,
      );

      if (existing) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME!,
              Key: existing.key,
            }),
          );
        } catch (deleteError) {
          logger.warn("Failed to delete old resume", {
            userId,
            key: existing.key,
            error: deleteError,
          });
        }
      }

      return res
        .status(201)
        .json({ id: resume.id, message: "File sent successfully" });
    } catch (error) {
      // clean up R2 if upload succeeded but DB failed
      if (uploadedKey && !dbSaved) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME!,
              Key: uploadedKey,
            }),
          );
        } catch (cleanupError) {
          logger.error("Failed to cleanup uploaded resume", {
            userId,
            key: uploadedKey,
            error: cleanupError,
          });
        }
      }
      if (!(error instanceof AppError)) {
        logger.error("Unable to upload or update resume", { userId, error });
      }
      next(error);
    }
  },
);

export { resumeRouter };
