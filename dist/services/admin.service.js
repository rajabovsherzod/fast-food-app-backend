import { eq, and, desc, sql, gte } from "drizzle-orm";
import db from "@/db";
import { orders, users, foods, categories, orderItems, } from "@/db/schema";
import ApiError from "@/utils/ApiError";
import { getOffset } from "@/utils/pagination.utils";
import { emitOrderStatusChanged, emitDeliveryAssigned } from "@/socket";
import { sendOrderNotification, sendDeliveryNotification } from "./telegram.service";
export const getDashboardStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [stats] = await db
        .select({
        totalOrders: sql `count(*)::int`,
        todayOrders: sql `count(*) FILTER (WHERE ${orders.createdAt} >= ${today})::int`,
        activeOrders: sql `count(*) FILTER (WHERE ${orders.status} IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering'))::int`,
        todayRevenue: sql `sum(CASE WHEN ${orders.createdAt} >= ${today} THEN ${orders.totalPrice}::numeric ELSE 0 END)`,
        totalRevenue: sql `sum(${orders.totalPrice}::numeric)`,
    })
        .from(orders);
    const [userStats] = await db
        .select({
        totalUsers: sql `count(*)::int`,
        activeUsers: sql `count(*) FILTER (WHERE ${users.isActive} = true)::int`,
        blockedUsers: sql `count(*) FILTER (WHERE ${users.isBlocked} = true)::int`,
    })
        .from(users);
    return { ...stats, ...userStats };
};
export const getAllOrders = async (page, limit, status) => {
    const offset = getOffset(page, limit);
    const conditions = status ? eq(orders.status, status) : undefined;
    const [orderList, [{ count }]] = await Promise.all([
        db
            .select()
            .from(orders)
            .where(conditions)
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql `count(*)::int` })
            .from(orders)
            .where(conditions),
    ]);
    return { orders: orderList, total: count };
};
export const getOrderDetails = async (orderId) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
        throw ApiError.notFound("Order not found");
    }
    // Get order items
    const items = await db
        .select({
        id: orderItems.id,
        foodId: orderItems.foodId,
        foodName: foods.nameUz,
        quantity: orderItems.quantity,
        price: orderItems.price,
        totalPrice: orderItems.totalPrice,
    })
        .from(orderItems)
        .innerJoin(foods, eq(orderItems.foodId, foods.id))
        .where(eq(orderItems.orderId, orderId));
    // Get user info
    const [user] = await db
        .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber,
    })
        .from(users)
        .where(eq(users.id, order.userId));
    return { ...order, items, user };
};
export const updateOrderStatus = async (orderId, status) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
        throw ApiError.notFound("Order not found");
    }
    const updateData = {
        status,
        updatedAt: new Date(),
    };
    if (status === "confirmed")
        updateData.confirmedAt = new Date();
    if (status === "preparing")
        updateData.preparingAt = new Date();
    if (status === "ready")
        updateData.readyAt = new Date();
    if (status === "delivering")
        updateData.deliveringAt = new Date();
    if (status === "delivered") {
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = "paid";
    }
    if (status === "cancelled")
        updateData.cancelledAt = new Date();
    const [updatedOrder] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))
        .returning();
    // Emit socket event
    emitOrderStatusChanged(updatedOrder);
    // Send Telegram notification to customer
    const [user] = await db.select().from(users).where(eq(users.id, order.userId));
    if (user?.telegramId) {
        await sendOrderNotification(user.telegramId, updatedOrder, status);
    }
    return updatedOrder;
};
export const assignDelivery = async (orderId, deliveryId) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
        throw ApiError.notFound("Order not found");
    }
    if (order.status !== "ready") {
        throw ApiError.badRequest("Order must be ready before assigning delivery");
    }
    const [delivery] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, deliveryId), eq(users.role, "delivery")));
    if (!delivery) {
        throw ApiError.notFound("Delivery person not found");
    }
    const [updatedOrder] = await db
        .update(orders)
        .set({
        deliveryId,
        updatedAt: new Date(),
    })
        .where(eq(orders.id, orderId))
        .returning();
    // Emit socket event
    emitDeliveryAssigned(updatedOrder);
    // Send Telegram notification to delivery person
    if (delivery.telegramId) {
        await sendDeliveryNotification(delivery.telegramId, updatedOrder);
    }
    // Send Telegram notification to customer
    const [user] = await db.select().from(users).where(eq(users.id, order.userId));
    if (user?.telegramId) {
        await sendOrderNotification(user.telegramId, updatedOrder, "assigned");
    }
    return updatedOrder;
};
export const getAllFoodsAdmin = async (page, limit) => {
    const offset = getOffset(page, limit);
    const [foodList, [{ count }]] = await Promise.all([
        db
            .select()
            .from(foods)
            .orderBy(desc(foods.createdAt))
            .limit(limit)
            .offset(offset),
        db.select({ count: sql `count(*)::int` }).from(foods),
    ]);
    return { foods: foodList, total: count };
};
export const createFood = async (data) => {
    const [food] = await db.insert(foods).values(data).returning();
    return food;
};
export const updateFood = async (id, data) => {
    const [food] = await db
        .update(foods)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(foods.id, id))
        .returning();
    if (!food) {
        throw ApiError.notFound("Food not found");
    }
    return food;
};
export const deleteFood = async (id) => {
    const [food] = await db
        .update(foods)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(foods.id, id))
        .returning();
    if (!food) {
        throw ApiError.notFound("Food not found");
    }
};
export const toggleFoodAvailability = async (id, isAvailable) => {
    const [food] = await db
        .update(foods)
        .set({ isAvailable, updatedAt: new Date() })
        .where(eq(foods.id, id))
        .returning();
    if (!food) {
        throw ApiError.notFound("Food not found");
    }
    return food;
};
export const getAllCategoriesAdmin = async () => {
    return await db.select().from(categories).orderBy(categories.sortOrder);
};
export const createCategory = async (data) => {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
};
export const updateCategory = async (id, data) => {
    const [category] = await db
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();
    if (!category) {
        throw ApiError.notFound("Category not found");
    }
    return category;
};
export const deleteCategory = async (id) => {
    const [category] = await db
        .update(categories)
        .set({ isActive: false })
        .where(eq(categories.id, id))
        .returning();
    if (!category) {
        throw ApiError.notFound("Category not found");
    }
};
export const getAllUsers = async (page, limit) => {
    const offset = getOffset(page, limit);
    const [userList, [{ count }]] = await Promise.all([
        db
            .select()
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(limit)
            .offset(offset),
        db.select({ count: sql `count(*)::int` }).from(users),
    ]);
    return { users: userList, total: count };
};
export const blockUser = async (id) => {
    const [user] = await db
        .update(users)
        .set({ isBlocked: true, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
    if (!user) {
        throw ApiError.notFound("User not found");
    }
    return user;
};
export const unblockUser = async (id) => {
    const [user] = await db
        .update(users)
        .set({ isBlocked: false, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
    if (!user) {
        throw ApiError.notFound("User not found");
    }
    return user;
};
export const getAllDeliveries = async () => {
    return await db
        .select()
        .from(users)
        .where(and(eq(users.role, "delivery"), eq(users.isActive, true)));
};
export const getDailyStatistics = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [stats] = await db
        .select({
        totalOrders: sql `count(*)::int`,
        revenue: sql `sum(${orders.totalPrice}::numeric)`,
        avgOrderValue: sql `avg(${orders.totalPrice}::numeric)`,
        cancelledOrders: sql `count(*) FILTER (WHERE ${orders.status} = 'cancelled')::int`,
    })
        .from(orders)
        .where(gte(orders.createdAt, today));
    return stats;
};
export const getRevenueStatistics = async (days) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const stats = await db
        .select({
        date: sql `DATE(${orders.createdAt})`,
        revenue: sql `sum(${orders.totalPrice}::numeric)`,
        orderCount: sql `count(*)::int`,
    })
        .from(orders)
        .where(and(gte(orders.createdAt, startDate), sql `${orders.status} != 'cancelled'`))
        .groupBy(sql `DATE(${orders.createdAt})`)
        .orderBy(sql `DATE(${orders.createdAt})`);
    return stats;
};
