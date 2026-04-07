import { eq, and, sql, desc } from "drizzle-orm";
import db from "@/db";
import { orders, users, orderItems, foods } from "@/db/schema";
import ApiError from "@/utils/ApiError";
import { emitOrderStatusChanged } from "@/socket";
import { sendOrderNotification } from "./telegram.service";

export const getAssignedOrders = async (deliveryId: number) => {
  return await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.deliveryId, deliveryId),
        sql`${orders.status} IN ('ready', 'delivering')`
      )
    )
    .orderBy(desc(orders.createdAt));
};

export const getOrderDetails = async (orderId: number, deliveryId: number) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.deliveryId, deliveryId)));

  if (!order) {
    throw ApiError.notFound("Order not found or not assigned to you");
  }

  // Get order items
  const items = await db
    .select({
      id: orderItems.id,
      foodName: foods.nameUz,
      quantity: orderItems.quantity,
      price: orderItems.price,
      notes: orderItems.notes,
    })
    .from(orderItems)
    .innerJoin(foods, eq(orderItems.foodId, foods.id))
    .where(eq(orderItems.orderId, orderId));

  // Get customer info
  const [customer] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      phoneNumber: users.phoneNumber,
      telegramId: users.telegramId,
    })
    .from(users)
    .where(eq(users.id, order.userId));

  return { ...order, items, customer };
};

export const acceptOrder = async (orderId: number, deliveryId: number) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.deliveryId, deliveryId)));

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.status !== "ready") {
    throw ApiError.badRequest("Order is not ready for delivery");
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "delivering",
      deliveringAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  // Emit socket event
  emitOrderStatusChanged(updatedOrder);

  // Send Telegram notification to customer
  const [user] = await db.select().from(users).where(eq(users.id, order.userId));
  if (user?.telegramId) {
    await sendOrderNotification(user.telegramId, updatedOrder, "delivering");
  }

  return updatedOrder;
};

export const completeDelivery = async (orderId: number, deliveryId: number) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.deliveryId, deliveryId)));

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.status !== "delivering") {
    throw ApiError.badRequest("Order is not in delivering status");
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "delivered",
      paymentStatus: "paid",
      deliveredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  // Emit socket event
  emitOrderStatusChanged(updatedOrder);

  // Send Telegram notification to customer
  const [user] = await db.select().from(users).where(eq(users.id, order.userId));
  if (user?.telegramId) {
    await sendOrderNotification(user.telegramId, updatedOrder, "delivered");
  }

  return updatedOrder;
};

export const updateLocation = async (
  deliveryId: number,
  orderId: number,
  latitude: string,
  longitude: string
) => {
  // Verify order is assigned to this delivery
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.deliveryId, deliveryId)));

  if (!order) {
    throw ApiError.notFound("Order not found or not assigned to you");
  }

  // Update order location
  await db
    .update(orders)
    .set({
      deliveryLatitude: latitude,
      deliveryLongitude: longitude,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Emit real-time location update via Socket.io
  const { getIO } = await import("@/socket");
  const io = getIO();
  io.to(`user:${order.userId}`).emit("delivery:location:update", {
    orderId,
    latitude,
    longitude,
  });
  io.to("admins").emit("delivery:location:update", {
    orderId,
    deliveryId,
    latitude,
    longitude,
  });

  console.log(`📍 Delivery ${deliveryId} location updated for order ${orderId}: ${latitude}, ${longitude}`);
};

export const getStatistics = async (deliveryId: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [stats] = await db
    .select({
      totalDeliveries: sql<number>`count(*)::int`,
      todayDeliveries: sql<number>`count(*) FILTER (WHERE ${orders.deliveredAt} >= ${today})::int`,
      activeDeliveries: sql<number>`count(*) FILTER (WHERE ${orders.status} = 'delivering')::int`,
      todayEarnings: sql<string>`sum(CASE WHEN ${orders.deliveredAt} >= ${today} THEN ${orders.deliveryPrice}::numeric ELSE 0 END)`,
      totalEarnings: sql<string>`sum(${orders.deliveryPrice}::numeric)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.deliveryId, deliveryId),
        eq(orders.status, "delivered" as any)
      )
    );

  return stats;
};

export const getDeliveryHistory = async (deliveryId: number, page: number = 1, limit: number = 20) => {
  const offset = (page - 1) * limit;

  const [history, [{ count }]] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        deliveryAddress: orders.deliveryAddress,
        totalPrice: orders.totalPrice,
        deliveryPrice: orders.deliveryPrice,
        paymentMethod: orders.paymentMethod,
        deliveredAt: orders.deliveredAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.deliveryId, deliveryId),
          eq(orders.status, "delivered" as any)
        )
      )
      .orderBy(desc(orders.deliveredAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.deliveryId, deliveryId),
          eq(orders.status, "delivered" as any)
        )
      ),
  ]);

  return { history, total: count };
};
