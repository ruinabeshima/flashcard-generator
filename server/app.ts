import express from "express";
import cors from "cors";
import { redis } from "./lib/redis/redis";
import { createRateLimiter } from "./lib/redis/rateLimiter";
import { clerkMiddleware } from "@clerk/express";
import { webhookRouter } from "./routes/webhooks";
import { applicationRouter } from "./routes/applications";
import { authRouter } from "./routes/auth";
import { resumeRouter } from "./routes/resumes";
import { feedbackRouter } from "./routes/feedback";

export default async function createApp() {
  if (!redis.isOpen) {
    await redis.connect();
  }

  const app = express();
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
    }),
  );

  app.use("/webhooks", webhookRouter);

  app.use(
    createRateLimiter({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      prefix: "rl:global:",
    }),
  );

  app.use(express.json());
  app.use(clerkMiddleware());
  app.use("/applications", applicationRouter);
  app.use("/auth", authRouter);
  app.use("/resumes", resumeRouter);
  app.use(
    "/feedback",
    createRateLimiter({ windowMs: 60_000, limit: 10, prefix: "rl:feedback:" }),
    feedbackRouter,
  );

  return app;
}
