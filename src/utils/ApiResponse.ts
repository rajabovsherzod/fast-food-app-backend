interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

class ApiResponse<T = any> {
  public readonly success: boolean = true;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T;
  public readonly meta?: PaginationMeta;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    data: T,
    message: string = "Success",
    meta?: PaginationMeta
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message: string = "Success") {
    return new ApiResponse(200, data, message);
  }

  static created<T>(data: T, message: string = "Created") {
    return new ApiResponse(201, data, message);
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = "Success"
  ) {
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
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
