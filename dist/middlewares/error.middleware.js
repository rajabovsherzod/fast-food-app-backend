import ApiError from "@/utils/ApiError";
import env from "@/config/env.config";
const errorHandler = (err, req, res, next) => {
    let error = err;
    // Drizzle/Postgres errors
    if (err.code === "23505") {
        error = ApiError.conflict("Duplicate field value");
    }
    if (err.code === "23503") {
        error = ApiError.badRequest("Referenced record not found");
    }
    if (err.code === "23502") {
        error = ApiError.badRequest("Required field is missing");
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        error = ApiError.unauthorized("Invalid token");
    }
    if (err.name === "TokenExpiredError") {
        error = ApiError.unauthorized("Token expired");
    }
    // Multer errors
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            error = ApiError.badRequest("File size too large");
        }
        else {
            error = ApiError.badRequest(err.message);
        }
    }
    // Default to 500 server error
    if (!(error instanceof ApiError)) {
        error = ApiError.internal(err.message || "Something went wrong");
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    // Log error
    if (!error.isOperational) {
        console.error("💥 PROGRAMMING ERROR:", {
            message: err.message,
            stack: err.stack,
            error: err,
        });
    }
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: error.errors || [],
        stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
export default errorHandler;
