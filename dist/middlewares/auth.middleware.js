import ApiError from "@/utils/ApiError";
import { verifyAccessToken } from "@/utils/jwt.utils";
import asyncHandler from "@/utils/asyncHandler";
export const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        throw ApiError.unauthorized("Access token is required");
    }
    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        throw ApiError.unauthorized("Invalid or expired token");
    }
});
export const authorize = (...roles) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw ApiError.unauthorized("Authentication required");
        }
        if (!roles.includes(req.user.role)) {
            throw ApiError.forbidden("You don't have permission to access this resource");
        }
        next();
    });
};
