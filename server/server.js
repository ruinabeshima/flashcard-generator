const express = require("express");
const app = express();
const cors = require("cors");
const { clerkMiddleware } = require("@clerk/express");
const { prisma } = require("./lib/prisma");
const { Webhook } = require("svix");

require("dotenv").config();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.post(
  "/webhooks/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // Verify the webhook
    let evt;
    try {
      evt = wh.verify(req.body, {
        "svix-id": req.headers["svix-id"],
        "svix-timestamp": req.headers["svix-timestamp"],
        "svix-signature": req.headers["svix-signature"],
      });
    } catch (error) {
      return res.status(400).json({ error: `Invalid signature: ${error}` });
    }

    // New user created or updated
    if (evt.type == "user.created") {
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
