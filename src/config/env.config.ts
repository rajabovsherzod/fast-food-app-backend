import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional(),
  WEB_APP_URL: z.string().default("http://localhost:5173"),
  
  CLIENT_URL: z.string().url().optional(),
  ADMIN_URL: z.string().url().optional(),
  
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.string().transform(Number).default("5242880"),
  PUBLIC_URL: z.string().optional(),
  
  DEFAULT_DELIVERY_PRICE: z.string().transform(Number).default("15000"),
  
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
  console.log("✅ Environment variables validated successfully");
} catch (error) {
  console.error("❌ Invalid environment variables:");
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
  }
  process.exit(1);
}

export default env;
