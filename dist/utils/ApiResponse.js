class ApiResponse {
    success = true;
    statusCode;
    message;
    data;
    meta;
    timestamp;
    constructor(statusCode, data, message = "Success", meta) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.meta = meta;
        this.timestamp = new Date().toISOString();
    }
    static success(data, message = "Success") {
        return new ApiResponse(200, data, message);
    }
    static created(data, message = "Created") {
        return new ApiResponse(201, data, message);
    }
    static paginated(data, page, limit, total, message = "Success") {
        const totalPages = Math.ceil(total / limit);
        const meta = {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        };
        return new ApiResponse(200, data, message, meta);
    }
}
export default ApiResponse;
