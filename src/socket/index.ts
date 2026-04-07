import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "@/utils/jwt.utils";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  role?: string;
}

let io: Server;

export const initializeSocket = (httpServer: HTTPServer) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    process.env.PUBLIC_URL,
  ].filter(Boolean) as string[];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.includes("trycloudflare.com") ||
          origin.includes("vercel.app") ||
          origin.includes("railway.app") ||
          allowedOrigins.includes(origin)
        ) {
          return callback(null, true);
        }
        callback(null, true); // production da env dan kelgan URL lar
      },
      credentials: true,
    },
    transports: ["polling", "websocket"],
    allowEIO3: true,
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.id;
      socket.role = decoded.role;

      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`✅ Socket connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.role})`);

    // Join user-specific room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join role-specific rooms
    if (socket.role === "admin" || socket.role === "super_admin" || socket.role === "manager") {
      socket.join("admins");
    } else if (socket.role === "delivery") {
      socket.join("deliveries");
    }

    // Delivery location update
    socket.on("delivery:location", (data: { orderId: number; latitude: string; longitude: string }) => {
      console.log(`📍 Delivery location update for order ${data.orderId}`);
      // Broadcast to order owner and admins
      io.to(`order:${data.orderId}`).emit("delivery:location:update", data);
      io.to("admins").emit("delivery:location:update", data);
    });

    // Typing indicators for chat
    socket.on("chat:typing", (data: { orderId: number }) => {
      socket.to(`order:${data.orderId}`).emit("chat:typing", {
        userId: socket.userId,
        orderId: data.orderId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Event emitters
export const emitOrderCreated = (order: any) => {
  io.to("admins").emit("order:created", order);
  console.log(`📦 Order created event emitted: ${order.orderNumber}`);
};

export const emitOrderStatusChanged = (order: any) => {
  // Notify order owner
  io.to(`user:${order.userId}`).emit("order:status:changed", order);
  
  // Notify admins
  io.to("admins").emit("order:status:changed", order);
  
  // Notify assigned delivery
  if (order.deliveryId) {
    io.to(`user:${order.deliveryId}`).emit("order:status:changed", order);
  }
  
  console.log(`🔄 Order status changed: ${order.orderNumber} -> ${order.status}`);
};

export const emitDeliveryAssigned = (order: any) => {
  // Notify delivery person
  io.to(`user:${order.deliveryId}`).emit("delivery:assigned", order);
  
  // Notify order owner
  io.to(`user:${order.userId}`).emit("delivery:assigned", order);
  
  // Notify admins
  io.to("admins").emit("delivery:assigned", order);
  
  console.log(`🚚 Delivery assigned: Order ${order.orderNumber} -> Delivery ${order.deliveryId}`);
};

export const emitNewMessage = (message: any) => {
  io.to(`order:${message.orderId}`).emit("message:new", message);
  console.log(`💬 New message in order ${message.orderId}`);
};
