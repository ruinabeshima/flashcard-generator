import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";
import { logger } from "../monitoring/logger";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

// Error handler middleware
export function errorHandler(
  // Express identifies error middleware by having 4 parameters, with the 1st one being "error"
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Known operational errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  // Prisma record not found
  if (
    error instanceof PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return res.status(404).json({ message: "Resource not found" });
  }

  // Fallback for anything unexpected
  logger.error("Unhandled error", { error, path: req.path });
  return res.status(500).json({ message: "Internal server error" });
}
