import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { webhookRouter } from "./routes/webhooks";
import { applicationRouter } from "./routes/applications";

dotenv.config();
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

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
