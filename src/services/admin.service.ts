import { eq, and, desc, sql, gte, isNotNull } from "drizzle-orm";
import db from "@/db";
import {
  orders,
  users,
  foods,
  categories,
  orderItems,
} from "@/db/schema";
import ApiError from "@/utils/ApiError";
import { getOffset } from "@/utils/pagination.utils";
import { emitOrderStatusChanged, emitDeliveryAssigned } from "@/socket";
import { sendOrderNotification, sendDeliveryNotification, sendBroadcast } from "./telegram.service";

export const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [stats] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      todayOrders: sql<number>`count(*) FILTER (WHERE ${orders.createdAt} >= ${today})::int`,
      activeOrders: sql<number>`count(*) FILTER (WHERE ${orders.status} IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering'))::int`,
      todayRevenue: sql<string>`sum(CASE WHEN ${orders.createdAt} >= ${today} THEN ${orders.totalPrice}::numeric ELSE 0 END)`,
      totalRevenue: sql<string>`sum(${orders.totalPrice}::numeric)`,
    })
    .from(orders);

  const [userStats] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      activeUsers: sql<number>`count(*) FILTER (WHERE ${users.isActive} = true)::int`,
      blockedUsers: sql<number>`count(*) FILTER (WHERE ${users.isBlocked} = true)::int`,
    })
    .from(users);

  return { ...stats, ...userStats };
};

export const getAllOrders = async (
  page: number,
  limit: number,
  status?: string
) => {
  const offset = getOffset(page, limit);

  const conditions = status ? eq(orders.status, status as any) : undefined;

  const [orderList, [{ count }]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(conditions)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(conditions),
  ]);

  return { orders: orderList, total: count };
};

export const getOrderDetails = async (orderId: number) => {
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
      foodImage: foods.image,
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

export const updateOrderStatus = async (orderId: number, status: string) => {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "confirmed") updateData.confirmedAt = new Date();
  if (status === "preparing") updateData.preparingAt = new Date();
  if (status === "ready") updateData.readyAt = new Date();
  if (status === "delivering") updateData.deliveringAt = new Date();
  if (status === "delivered") {
    updateData.deliveredAt = new Date();
    updateData.paymentStatus = "paid";
  }
  if (status === "cancelled") updateData.cancelledAt = new Date();

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

export const assignDelivery = async (orderId: number, phoneNumber: string) => {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.status !== "ready") {
    throw ApiError.badRequest("Order must be ready before assigning delivery");
  }

  // Find delivery person by phone number
  const [delivery] = await db
    .select()
    .from(users)
    .where(and(eq(users.phoneNumber, phoneNumber), eq(users.role, "delivery")));

  if (!delivery) {
    throw ApiError.notFound(
      `Delivery person with phone number ${phoneNumber} not found. ` +
      `Make sure the delivery person has registered via Telegram bot and shared their contact.`
    );
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({
      deliveryId: delivery.id,
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

  return { ...updatedOrder, delivery: { id: delivery.id, firstName: delivery.firstName, phoneNumber: delivery.phoneNumber } };
};

export const getAllFoodsAdmin = async (page: number, limit: number) => {
  const offset = getOffset(page, limit);

  const [foodList, [{ count }]] = await Promise.all([
    db
      .select()
      .from(foods)
      .orderBy(desc(foods.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(foods),
  ]);

  return { foods: foodList, total: count };
};

export const createFood = async (data: any) => {
  const [food] = await db.insert(foods).values(data).returning();
  return food;
};

export const updateFood = async (id: number, data: any) => {
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

export const deleteFood = async (id: number) => {
  const [food] = await db
    .update(foods)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(foods.id, id))
    .returning();

  if (!food) {
    throw ApiError.notFound("Food not found");
  }
};

export const toggleFoodAvailability = async (
  id: number,
  isAvailable: boolean
) => {
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

export const createCategory = async (data: any) => {
  const [category] = await db.insert(categories).values(data).returning();
  return category;
};

export const updateCategory = async (id: number, data: any) => {
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

export const deleteCategory = async (id: number) => {
  const [category] = await db
    .update(categories)
    .set({ isActive: false })
    .where(eq(categories.id, id))
    .returning();

  if (!category) {
    throw ApiError.notFound("Category not found");
  }
};

export const getAllUsers = async (page: number, limit: number) => {
  const offset = getOffset(page, limit);

  const [userList, [{ count }]] = await Promise.all([
    db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(users),
  ]);

  return { users: userList, total: count };
};

export const blockUser = async (id: number) => {
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

export const unblockUser = async (id: number) => {
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
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      phoneNumber: users.phoneNumber,
      telegramId: users.telegramId,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.role, "delivery"), eq(users.isActive, true)))
    .orderBy(desc(users.createdAt));
};

export const broadcastToUsers = async (
  message: string,
  imageUrl?: string | null
) => {
  // Barcha aktiv va bloklangan bo'lmagan, telegramId si bor userlarni olish
  const activeUsers = await db
    .select({ telegramId: users.telegramId, firstName: users.firstName })
    .from(users)
    .where(
      and(
        isNotNull(users.telegramId),
        eq(users.isBlocked, false),
        eq(users.isActive, true)
      )
    );

  let sent = 0;
  let failed = 0;

  // Parallel emas, ketma-ket yuboramiz (Telegram rate limit: 30 msg/sec)
  for (const user of activeUsers) {
    if (!user.telegramId) continue;
    const ok = await sendBroadcast(user.telegramId, message, imageUrl);
    if (ok) sent++;
    else failed++;
    // Rate limiting: har 30 ms da 1 ta
    await new Promise((r) => setTimeout(r, 35));
  }

  return { total: activeUsers.length, sent, failed };
};

export const getDailyStatistics = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [stats] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      revenue: sql<string>`sum(${orders.totalPrice}::numeric)`,
      avgOrderValue: sql<string>`avg(${orders.totalPrice}::numeric)`,
      cancelledOrders: sql<number>`count(*) FILTER (WHERE ${orders.status} = 'cancelled')::int`,
    })
    .from(orders)
    .where(gte(orders.createdAt, today));

  return stats;
};

export const getRevenueStatistics = async (days: number) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      revenue: sql<string>`sum(${orders.totalPrice}::numeric)`,
      orderCount: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        sql`${orders.status} != 'cancelled'`
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  return stats;
};
