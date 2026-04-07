import { Server } from "socket.io";
import env from "@/config/env.config";
import { verifyAccessToken } from "@/utils/jwt.utils";
let io;
export const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [env.CLIENT_URL, env.ADMIN_URL].filter((url) => !!url),
            credentials: true,
        },
    });
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
            if (!token) {
                return next(new Error("Authentication token required"));
            }
            const decoded = verifyAccessToken(token);
            socket.userId = decoded.id;
            socket.role = decoded.role;
            next();
        }
        catch (error) {
            next(new Error("Invalid authentication token"));
        }
    });
    io.on("connection", (socket) => {
        console.log(`✅ Socket connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.role})`);
        // Join user-specific room
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }
        // Join role-specific rooms
        if (socket.role === "admin" || socket.role === "super_admin" || socket.role === "manager") {
            socket.join("admins");
        }
        else if (socket.role === "delivery") {
            socket.join("deliveries");
        }
        // Delivery location update
        socket.on("delivery:location", (data) => {
            console.log(`📍 Delivery location update for order ${data.orderId}`);
            // Broadcast to order owner and admins
            io.to(`order:${data.orderId}`).emit("delivery:location:update", data);
            io.to("admins").emit("delivery:location:update", data);
        });
        // Typing indicators for chat
        socket.on("chat:typing", (data) => {
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
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
// Event emitters
export const emitOrderCreated = (order) => {
    io.to("admins").emit("order:created", order);
    console.log(`📦 Order created event emitted: ${order.orderNumber}`);
};
export const emitOrderStatusChanged = (order) => {
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
export const emitDeliveryAssigned = (order) => {
    // Notify delivery person
    io.to(`user:${order.deliveryId}`).emit("delivery:assigned", order);
    // Notify order owner
    io.to(`user:${order.userId}`).emit("delivery:assigned", order);
    // Notify admins
    io.to("admins").emit("delivery:assigned", order);
    console.log(`🚚 Delivery assigned: Order ${order.orderNumber} -> Delivery ${order.deliveryId}`);
};
export const emitNewMessage = (message) => {
    io.to(`order:${message.orderId}`).emit("message:new", message);
    console.log(`💬 New message in order ${message.orderId}`);
};
