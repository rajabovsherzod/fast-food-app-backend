import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import * as authService from "@/services/auth.service";
export const telegramLogin = asyncHandler(async (req, res) => {
    const result = await authService.telegramLogin(req.body);
    res.json(ApiResponse.success(result, "Login successful"));
});
export const adminLogin = asyncHandler(async (req, res) => {
    const result = await authService.adminLogin(req.body);
    res.json(ApiResponse.success(result, "Admin login successful"));
});
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.json(ApiResponse.success(result, "Token refreshed"));
});
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await authService.logout(refreshToken);
    }
    res.json(ApiResponse.success(null, "Logout successful"));
});
