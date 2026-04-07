import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "@/config/env.config";
import { requestLogger } from "@/middlewares/logger.middleware";
import { apiLimiter } from "@/middlewares/rateLimit.middleware";
import { notFoundHandler } from "@/middlewares/notFound.middleware";
import errorHandler from "@/middlewares/error.middleware";
import routes from "@/routes";
const app = express();
// Security middleware
app.use(helmet());
// CORS
const corsOptions = {
    origin: [env.CLIENT_URL, env.ADMIN_URL].filter((url) => !!url),
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
// Static files
app.use("/uploads", express.static("uploads"));
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// API routes
app.use("/api/v1", routes);
// 404 handler
app.use(notFoundHandler);
// Error handler
app.use(errorHandler);
export default app;
