import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { webhookRouter } from "./routes/webhooks";
import { applicationRouter } from "./routes/applications";
import { authRouter } from "./routes/auth";
import { resumeRouter } from "./routes/resumes";
import { feedbackRouter } from "./routes/feedback";

export default function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
    }),
  );

  app.use("/webhooks", webhookRouter);
  app.use(express.json());
  app.use(clerkMiddleware());
  app.use("/applications", applicationRouter);
  app.use("/auth", authRouter);
  app.use("/resumes", resumeRouter);
  app.use("/feedback", feedbackRouter);

  return app;
}
