import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import { prisma } from "./lib/prisma";
import { Webhook } from "svix";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);
app.use(clerkMiddleware());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello World" });
});

app.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) throw new Error("Missing CLERK_WEBHOOK_SECRET");

    const wh = new Webhook(secret);

    // Verify the webhook
    let evt: any;
    try {
      evt = wh.verify(req.body, {
        "svix-id": req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      });
    } catch (error) {
      res.status(400).json({ error: `Invalid signature: ${error}` });
      return;
    }

    // New user created or updated
    if (evt.type === "user.created") {
      await prisma.user.upsert({
        where: { clerkId: evt.data.id },
        create: {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0].email_address,
          imageUrl: evt.data.image_url,
        },
        update: {
          email: evt.data.email_addresses[0].email_address,
          imageUrl: evt.data.image_url,
        },
      });
    }

    // User deleted
    if (evt.type == "user.deleted") {
      await prisma.user.delete({
        where: {
          clerkId: evt.data.id,
        },
      });
    }

    res.json({ received: true });
  },
);

app.use(express.json());
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
