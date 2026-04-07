import { eq } from "drizzle-orm";
import db from "@/db";
import { users, admins, refreshTokens } from "@/db/schema";
import ApiError from "@/utils/ApiError";
import { hashPassword, comparePassword } from "@/utils/password.utils";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "@/utils/jwt.utils";

interface TelegramLoginData {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
}

interface AdminLoginData {
  email: string;
  password: string;
}

export const telegramLogin = async (data: TelegramLoginData) => {
  console.log('🔐 Telegram Login Attempt:', {
    telegramId: data.telegramId,
    firstName: data.firstName,
    hasPhoneNumber: !!data.phoneNumber,
  });

  // Check if user exists
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, data.telegramId));

  // Create new user if not exists
  if (!user) {
    console.log('👤 Creating new user:', data.telegramId);
    
    // If no phone number provided, create with temporary placeholder
    // Bot will update it when user shares contact
    const phoneNumber = data.phoneNumber || `temp_${data.telegramId}`;
    
    [user] = await db
      .insert(users)
      .values({
        telegramId: data.telegramId,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        phoneNumber: phoneNumber,
        role: "user",
      })
      .returning();
      
    console.log('✅ User created:', {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      isTemporary: user.phoneNumber.startsWith('temp_'),
    });
  } else {
    console.log('👤 Updating existing user:', user.id);
    
    // Update user info
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      updatedAt: new Date(),
    };
    
    // Update phone number if provided and not temporary
    if (data.phoneNumber && !data.phoneNumber.startsWith('temp_')) {
      updateData.phoneNumber = data.phoneNumber;
      console.log('📱 Updating phone number:', data.phoneNumber);
    }
    
    [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();
      
    console.log('✅ User updated:', {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      isTemporary: user.phoneNumber.startsWith('temp_'),
    });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    console.log('🚫 User is blocked:', user.id);
    throw ApiError.forbidden("Your account has been blocked");
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
    telegramId: user.telegramId,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    role: user.role,
    telegramId: user.telegramId,
  });

  // Save refresh token — 100 yil amal qiladi (amalda muddatsiz)
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
  });

  console.log('✅ Login successful:', {
    userId: user.id,
    hasRealPhone: !user.phoneNumber.startsWith('temp_'),
  });

  return {
    user: {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      phoneNumber: user.phoneNumber.startsWith('temp_') ? null : user.phoneNumber,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const adminLogin = async (data: AdminLoginData) => {
  // Find admin
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, data.email));

  if (!admin) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Check if admin is active
  if (!admin.isActive) {
    throw ApiError.forbidden("Your account has been deactivated");
  }

  // Verify password
  const isPasswordValid = await comparePassword(data.password, admin.password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Update last login
  await db
    .update(admins)
    .set({ lastLogin: new Date() })
    .where(eq(admins.id, admin.id));

  // Generate tokens
  const accessToken = generateAccessToken({
    id: admin.id,
    role: admin.role,
  });

  const refreshToken = generateRefreshToken({
    id: admin.id,
    role: admin.role,
  });

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (token: string) => {
  try {
    const decoded = verifyRefreshToken(token);

    // Check if refresh token exists in database
    const [tokenRecord] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token));

    if (!tokenRecord) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id));
      throw ApiError.unauthorized("Refresh token expired");
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      id: decoded.id,
      role: decoded.role,
      telegramId: decoded.telegramId,
    });

    return { accessToken };
  } catch (error) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
};

export const logout = async (token: string) => {
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
};
