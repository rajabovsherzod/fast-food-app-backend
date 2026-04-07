import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { validate } from "@/middlewares/validate.middleware";
import { authLimiter } from "@/middlewares/rateLimit.middleware";
import * as authValidator from "@/validators/auth.validator";
const router = Router();
// Telegram login
router.post("/telegram-login", authLimiter, validate(authValidator.telegramLoginSchema), authController.telegramLogin);
// Admin login
router.post("/admin-login", authLimiter, validate(authValidator.adminLoginSchema), authController.adminLogin);
// Refresh token
router.post("/refresh-token", validate(authValidator.refreshTokenSchema), authController.refreshToken);
// Logout
router.post("/logout", authController.logout);
export default router;
