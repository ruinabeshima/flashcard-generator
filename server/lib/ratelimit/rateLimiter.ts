import rateLimit from "express-rate-limit";

export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 10,
  message: "Too many tailoring requests, please try again later",
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 20,
  message: "Too many resume uploads. Try again later",
});

export const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50,
  message: "Too many requests. Try again later",
});
