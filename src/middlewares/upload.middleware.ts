import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import env from "@/config/env.config";

// Ensure upload directory exists
const uploadDir = env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".webp"); // Always save as WebP
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

// Helper function to optimize image
export const optimizeImage = async (filePath: string): Promise<void> => {
  try {
    const buffer = await sharp(filePath)
      .resize(800, 800, { // Max 800x800, maintain aspect ratio
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 }) // Convert to WebP with 85% quality
      .toBuffer();

    await fs.promises.writeFile(filePath, buffer);
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
};

// Helper function to get file URL
export const getFileUrl = (req: any, filename: string): string => {
  // Use PUBLIC_URL from env if available, otherwise fallback to request host
  const baseUrl = env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/${filename}`;
};
