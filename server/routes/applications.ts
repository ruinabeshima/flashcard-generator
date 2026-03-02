import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const applicationRouter = express.Router();

export { applicationRouter };
