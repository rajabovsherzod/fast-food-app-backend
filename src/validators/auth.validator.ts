import { z } from "zod";

export const telegramLoginSchema = z.object({
  body: z.object({
    telegramId: z.string().min(1, "Telegram ID is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    username: z.string().optional(),
    phoneNumber: z.string().regex(/^\+998\d{9}$/, "Invalid phone number format").optional(),
  }),
});

export const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
