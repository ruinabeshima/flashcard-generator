import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { applicationRouter } from "./routes/applications";
import { authRouter } from "./routes/auth";
import { resumeRouter } from "./routes/resumes";
import { feedbackRouter } from "./routes/feedback";
import { tailoringRouter } from "./routes/tailoring";
import { errorHandler } from "./lib/errors/errorHandler";
import { randomUUID } from "node:crypto";
import { logger } from "./lib/monitoring/logger";

export default function createApp() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("x-request-id", requestId);

    const start = Date.now();
    res.on("finish", () => {
      logger.info({
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });

    next();
  });

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(express.json());
  app.use("/applications", applicationRouter);
  app.use("/auth", authRouter);
  app.use("/resumes", resumeRouter);
  app.use("/feedback", feedbackRouter);
  app.use("/tailoring", tailoringRouter);
  app.use(errorHandler);

  return app;
}
