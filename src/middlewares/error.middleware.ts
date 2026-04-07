import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError";
import env from "@/config/env.config";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Drizzle/Postgres errors
  if (err.code === "23505") {
    error = ApiError.conflict("Ma'lumot allaqachon mavjud (Duplicate field value)");
  }

  if (err.code === "23503") {
    error = ApiError.badRequest("Bog'langan ma'lumot topilmadi (Referenced record not found)");
  }

  if (err.code === "23502") {
    error = ApiError.badRequest("Majburiy maydon to'ldirilmagan (Required field is missing)");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Token noto'g'ri (Invalid token). Iltimos, qaytadan kiring.");
  }

  if (err.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Token muddati tugagan (Token expired). Iltimos, qaytadan kiring.");
  }

  // Multer errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      error = ApiError.badRequest("Fayl hajmi juda katta (File size too large)");
    } else {
      error = ApiError.badRequest(err.message);
    }
  }

  // Default to 500 server error
  if (!(error instanceof ApiError)) {
    error = ApiError.internal(err.message || "Serverda xatolik yuz berdi (Something went wrong)");
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Log error with detailed information
  const logPrefix = statusCode >= 500 ? "💥 SERVER ERROR" : statusCode === 401 ? "🔒 AUTH ERROR" : statusCode === 403 ? "⛔ FORBIDDEN" : "⚠️ CLIENT ERROR";
  
  console.error(`${logPrefix}:`, {
    statusCode,
    message,
    method: req.method,
    path: req.path,
    userId: req.user?.id || "unauthenticated",
    hasAuthHeader: !!req.headers.authorization,
    authHeaderPrefix: req.headers.authorization?.substring(0, 20) + "...",
    body: req.method !== "GET" ? req.body : undefined,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: error.errors || [],
    details: env.NODE_ENV === "development" ? {
      originalError: err.message,
      path: req.path,
      method: req.method,
      hasAuth: !!req.headers.authorization,
    } : undefined,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export default errorHandler;
