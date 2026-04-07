class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors: any[] = [],
    public isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string = "Bad Request", errors: any[] = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message: string = "Not Found") {
    return new ApiError(404, message);
  }

  static conflict(message: string = "Conflict") {
    return new ApiError(409, message);
  }

  static unprocessableEntity(message: string = "Unprocessable Entity", errors: any[] = []) {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message: string = "Too Many Requests") {
    return new ApiError(429, message);
  }

  static internal(message: string = "Internal Server Error") {
    return new ApiError(500, message, [], false);
  }
}

export default ApiError;
