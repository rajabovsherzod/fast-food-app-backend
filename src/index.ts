import { createServer } from "http";
import app from "./app";
import env from "@/config/env.config";
import { testConnection } from "@/db";
import { initializeSocket } from "@/socket";
import { initializeTelegramBot } from "@/services/telegram.service";
import "./bot"; // Import bot to start polling

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Initialize Telegram bot
    initializeTelegramBot();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);

    // Start server
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API: http://localhost:${env.PORT}/api/v1`);
      console.log(`💚 Health: http://localhost:${env.PORT}/health`);
      console.log(`🔌 Socket.IO: Enabled`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
