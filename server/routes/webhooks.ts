import express, { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Webhook } from "svix";
import logAudit from "../lib/audit";

const webhookRouter = express.Router();

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    image_url: string;
  };
}

webhookRouter.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) throw new Error("Missing CLERK_WEBHOOK_SECRET");

    const wh = new Webhook(secret);

    // Verify the webhook
    let evt: ClerkWebhookEvent;
    try {
      evt = wh.verify(req.body, {
        "svix-id": req.headers["svix-id"] as string,
        "svix-timestamp": req.headers["svix-timestamp"] as string,
        "svix-signature": req.headers["svix-signature"] as string,
      }) as ClerkWebhookEvent;
    } catch (error) {
      res.status(400).json({ message: `Invalid signature: ${error}` });
      return;
    }

    // New user created or updated
    if (evt.type === "user.created" || evt.type === "user.updated") {
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

      await logAudit(
        evt.data.id,
        "USER_CREATED",
        undefined,
        undefined,
        undefined,
      );
    }

    // User deleted
    if (evt.type == "user.deleted") {
      if (!evt.data.id) {
        res.status(400).json({ message: "Missing user ID" });
        return;
      }

      await prisma.user.delete({
        where: {
          clerkId: evt.data.id,
        },
      });

      await logAudit(
        evt.data.id,
        "USER_DELETED",
        undefined,
        undefined,
        undefined,
      );
    }

    res.json({ received: true });
  },
);

export { webhookRouter };
