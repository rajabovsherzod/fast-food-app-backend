import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import ApiError from "@/utils/ApiError";
import * as authService from "@/services/auth.service";
import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const telegramLogin = asyncHandler(async (req: Request, res: Response) => {
  console.log('📱 Telegram Login Request:', {
    telegramId: req.body.telegramId,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    phoneNumber: req.body.phoneNumber ? '✅ Bor' : '❌ Yo\'q',
  });
  
  const result = await authService.telegramLogin(req.body);
  
  console.log('✅ Telegram Login Success:', {
    userId: result.user.id,
    telegramId: result.user.telegramId,
    phoneNumber: result.user.phoneNumber ? '✅ Bor' : '❌ Yo\'q',
  });
  
  res.json(ApiResponse.success(result, "Login successful"));
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.adminLogin(req.body);
  res.json(ApiResponse.success(result, "Admin login successful"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  res.json(ApiResponse.success(result, "Token refreshed"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  res.json(ApiResponse.success(null, "Logout successful"));
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const [user] = await db
    .select({
      id: users.id,
      telegramId: users.telegramId,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      phoneNumber: users.phoneNumber,
      role: users.role,
      isBlocked: users.isBlocked,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  
  // Hide temporary phone numbers
  const userData = {
    ...user,
    phoneNumber: user.phoneNumber.startsWith('temp_') ? null : user.phoneNumber,
    needsPhoneNumber: user.phoneNumber.startsWith('temp_'),
  };
  
  res.json(ApiResponse.success(userData, "Profile fetched successfully"));
});
