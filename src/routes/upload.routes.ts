import { Router } from "express";
import * as uploadController from "@/controllers/upload.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/upload.middleware";

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin", "super_admin", "manager"));

// Upload single image
router.post("/image", upload.single("image"), uploadController.uploadImage);

// Upload multiple images
router.post("/images", upload.array("images", 10), uploadController.uploadMultipleImages);

export default router;
