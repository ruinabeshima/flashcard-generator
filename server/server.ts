import dotenv from "dotenv";
dotenv.config();
import createApp from "./app";
import { logger } from "./lib/monitoring/logger";

function requireEnv(keys: string[]) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

requireEnv([
  "DATABASE_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "OPENAI_API_KEY",
  "FIREBASE_SERVICE_ACCOUNT",
]);

const app = createApp();

const port = process.env.PORT || 8080;
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
