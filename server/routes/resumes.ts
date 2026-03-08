import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "@clerk/express";

const resumeRouter = express.Router();

resumeRouter.post("/upload", (req: Request, res: Response) => {});

export { resumeRouter };
