class ApiError extends Error {
    statusCode;
    errors;
    isOperational;
    constructor(statusCode, message, errors = [], isOperational = true, stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    static badRequest(message = "Bad Request", errors = []) {
        return new ApiError(400, message, errors);
    }
    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }
    static notFound(message = "Not Found") {
        return new ApiError(404, message);
    }
    static conflict(message = "Conflict") {
        return new ApiError(409, message);
    }
    static unprocessableEntity(message = "Unprocessable Entity", errors = []) {
        return new ApiError(422, message, errors);
    }
    static tooManyRequests(message = "Too Many Requests") {
        return new ApiError(429, message);
    }
    static internal(message = "Internal Server Error") {
        return new ApiError(500, message, [], false);
    }
}
export default ApiError;
