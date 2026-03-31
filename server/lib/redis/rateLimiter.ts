import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "./redis";

export function createRateLimiter(options: {
  windowMs: number;
  limit: number;
  prefix: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.sendCommand(args),
      prefix: options.prefix,
    }),
  });
}