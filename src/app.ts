import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import env from "@/config/env.config";
import { requestLogger } from "@/middlewares/logger.middleware";
import { apiLimiter } from "@/middlewares/rateLimit.middleware";
import { notFoundHandler } from "@/middlewares/notFound.middleware";
import errorHandler from "@/middlewares/error.middleware";
import routes from "@/routes";

const app: Express = express();

// Trust proxy (for Cloudflare tunnel, nginx, etc.)
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws://localhost:3000", "http://localhost:3000", "https://cdn.socket.io"],
    },
  },
}));

// CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Cloudflare tunnels
    if (origin.includes('trycloudflare.com')) {
      return callback(null, true);
    }
    
    // Allow ngrok
    if (origin.includes('ngrok')) {
      return callback(null, true);
    }
    
    // Allow configured URLs
    const allowedOrigins = [env.CLIENT_URL, env.ADMIN_URL].filter((url): url is string => !!url);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all for development
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logger
app.use(requestLogger);

// Rate limiting
app.use("/api", apiLimiter);

// Static files with cache headers
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", (_req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Vary', 'Accept-Encoding');
  next();
}, express.static(uploadDir));
app.use(express.static("public"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1", routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
