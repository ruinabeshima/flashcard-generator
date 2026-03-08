import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "../lib/r2";
import { upload } from "../lib/multer";
import { requireAuth } from "@clerk/express";

const resumeRouter = express.Router();

resumeRouter.post(
  "/upload",
  requireAuth(),
  upload.single("file"),
  async (req: Request, res: Response) => {
    const { userId } = req.auth;
    const { file } = req;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: file.originalname,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      res.status(201).json({ message: "File sent successfully" });
    } catch {
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

export { resumeRouter };
