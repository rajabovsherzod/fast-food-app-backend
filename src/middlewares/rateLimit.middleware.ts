import rateLimit from "express-rate-limit";
import ApiError from "@/utils/ApiError";
import env from "@/config/env.config";

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests("Too many requests, please try again later"));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later",
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests("Too many login attempts"));
  },
});
