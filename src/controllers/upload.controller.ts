import { Request, Response } from "express";
import path from "path";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import ApiError from "@/utils/ApiError";
import { getFileUrl, optimizeImage } from "@/middlewares/upload.middleware";
import env from "@/config/env.config";

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  // Optimize image
  const uploadDir = env.UPLOAD_DIR || "uploads";
  const filePath = path.join(uploadDir, req.file.filename);
  await optimizeImage(filePath);

  const fileUrl = getFileUrl(req, req.file.filename);

  res.json(
    ApiResponse.success(
      {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: 'image/webp',
      },
      "File uploaded successfully"
    )
  );
});

export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw ApiError.badRequest("No files uploaded");
  }

  const uploadDir = env.UPLOAD_DIR || "uploads";

  // Optimize all images
  await Promise.all(
    req.files.map(async (file) => {
      const filePath = path.join(uploadDir, file.filename);
      await optimizeImage(filePath);
    })
  );

  const files = req.files.map((file) => ({
    filename: file.filename,
    url: getFileUrl(req, file.filename),
    size: file.size,
    mimetype: 'image/webp',
  }));

  res.json(ApiResponse.success(files, "Files uploaded successfully"));
});
