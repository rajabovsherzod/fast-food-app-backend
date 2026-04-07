import { eq, and, desc, sql } from "drizzle-orm";
import db from "@/db";
import { orders, orderItems, orderItemAddons, foods, addons, users } from "@/db/schema";
import ApiError from "@/utils/ApiError";
import { generateOrderNumber } from "@/utils/orderNumber.utils";
import { getOffset } from "@/utils/pagination.utils";
import env from "@/config/env.config";
import { emitOrderCreated } from "@/socket";
import { sendOrderNotification, sendAdminNotification } from "./telegram.service";

interface OrderItem {
  foodId: number;
  quantity: number;
  notes?: string;
  addons?: { addonId: number; quantity: number }[];
}

interface CreateOrderData {
  userId: number;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryLatitude?: string;
  deliveryLongitude?: string;
  phoneNumber: string;
  notes?: string;
  promoCodeId?: number;
  paymentMethod?: "cash" | "card" | "click" | "payme";
}

export const createOrder = async (data: CreateOrderData) => {
  // Validate user has real phone number (not temporary)
  const [user] = await db.select().from(users).where(eq(users.id, data.userId));
  
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  
  if (!user.phoneNumber || user.phoneNumber.startsWith('temp_')) {
    throw ApiError.badRequest(
      "Telefon raqamingiz topilmadi. Iltimos, botda /start buyrug'ini yuborib, telefon raqamingizni ulashing."
    );
  }
  
  console.log('📦 Creating order for user:', {
    userId: user.id,
    phoneNumber: user.phoneNumber,
    itemCount: data.items.length,
  });

  // Calculate order totals
  let subtotal = 0;
  const itemsWithPrices: any[] = [];

  for (const item of data.items) {
    // Get food price
    const [food] = await db.select().from(foods).where(eq(foods.id, item.foodId));

    if (!food || !food.isAvailable) {
      throw ApiError.badRequest(`Food with ID ${item.foodId} is not available`);
    }

    const foodPrice = parseFloat(food.price);
    let itemTotal = foodPrice * item.quantity;

    // Calculate addons price
    const addonPrices: any[] = [];
    if (item.addons && item.addons.length > 0) {
      for (const addon of item.addons) {
        const [addonData] = await db
          .select()
          .from(addons)
          .where(eq(addons.id, addon.addonId));

        if (!addonData || !addonData.isAvailable) {
          throw ApiError.badRequest(`Addon with ID ${addon.addonId} is not available`);
        }

        const addonPrice = parseFloat(addonData.price);
        itemTotal += addonPrice * addon.quantity * item.quantity;
        addonPrices.push({
          addonId: addon.addonId,
          quantity: addon.quantity,
          price: addonPrice,
        });
      }
    }

    subtotal += itemTotal;
    itemsWithPrices.push({
      foodId: item.foodId,
      quantity: item.quantity,
      price: foodPrice,
      totalPrice: itemTotal,
      notes: item.notes,
      addons: addonPrices,
    });
  }

  const deliveryPrice = env.DEFAULT_DELIVERY_PRICE;
  const promoDiscount = 0; // TODO: Implement promo code logic
  const totalPrice = subtotal + deliveryPrice - promoDiscount;

  // Use user's phone number from database
  const phoneNumber = data.phoneNumber || user.phoneNumber;

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      userId: data.userId,
      orderNumber: generateOrderNumber(),
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: data.paymentMethod || "cash",
      deliveryAddress: data.deliveryAddress,
      deliveryLatitude: data.deliveryLatitude,
      deliveryLongitude: data.deliveryLongitude,
      phoneNumber: phoneNumber,
      subtotal: subtotal.toString(),
      deliveryPrice: deliveryPrice.toString(),
      promoDiscount: promoDiscount.toString(),
      totalPrice: totalPrice.toString(),
      notes: data.notes,
      promoCodeId: data.promoCodeId,
    })
    .returning();

  console.log('✅ Order created:', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalPrice: order.totalPrice,
  });

  // Create order items
  for (const item of itemsWithPrices) {
    const [orderItem] = await db
      .insert(orderItems)
      .values({
        orderId: order.id,
        foodId: item.foodId,
        quantity: item.quantity,
        price: item.price.toString(),
        totalPrice: item.totalPrice.toString(),
        notes: item.notes,
      })
      .returning();

    // Create order item addons
    if (item.addons && item.addons.length > 0) {
      for (const addon of item.addons) {
        await db.insert(orderItemAddons).values({
          orderItemId: orderItem.id,
          addonId: addon.addonId,
          quantity: addon.quantity,
          price: addon.price.toString(),
        });
      }
    }
  }

  const fullOrder = await getOrderById(order.id, data.userId);

  // Emit socket event for real-time notification
  emitOrderCreated(fullOrder);

  // Send Telegram notification to admins
  await sendAdminNotification(fullOrder);

  // Send Telegram notification to customer
  if (user.telegramId) {
    await sendOrderNotification(user.telegramId, fullOrder, "pending");
  }

  return fullOrder;
};

export const getOrderById = async (orderId: number, userId: number) => {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      deliveryAddress: orders.deliveryAddress,
      deliveryLatitude: orders.deliveryLatitude,
      deliveryLongitude: orders.deliveryLongitude,
      phoneNumber: orders.phoneNumber,
      subtotal: orders.subtotal,
      deliveryPrice: orders.deliveryPrice,
      promoDiscount: orders.promoDiscount,
      totalPrice: orders.totalPrice,
      notes: orders.notes,
      estimatedDeliveryTime: orders.estimatedDeliveryTime,
      createdAt: orders.createdAt,
      confirmedAt: orders.confirmedAt,
      preparingAt: orders.preparingAt,
      readyAt: orders.readyAt,
      deliveringAt: orders.deliveringAt,
      deliveredAt: orders.deliveredAt,
      cancelledAt: orders.cancelledAt,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  // Get order items with food details
  const items = await db
    .select({
      id: orderItems.id,
      foodId: orderItems.foodId,
      foodName: foods.nameUz,
      foodImage: foods.image,
      quantity: orderItems.quantity,
      price: orderItems.price,
      totalPrice: orderItems.totalPrice,
      notes: orderItems.notes,
    })
    .from(orderItems)
    .innerJoin(foods, eq(orderItems.foodId, foods.id))
    .where(eq(orderItems.orderId, orderId));

  // Get addons for each item
  for (const item of items) {
    const itemAddons = await db
      .select({
        id: orderItemAddons.id,
        addonId: orderItemAddons.addonId,
        addonName: addons.nameUz,
        quantity: orderItemAddons.quantity,
        price: orderItemAddons.price,
      })
      .from(orderItemAddons)
      .innerJoin(addons, eq(orderItemAddons.addonId, addons.id))
      .where(eq(orderItemAddons.orderItemId, item.id));

    (item as any).addons = itemAddons;
  }

  return { ...order, items };
};

export const getUserOrders = async (
  userId: number,
  page: number,
  limit: number,
  status?: string
) => {
  const offset = getOffset(page, limit);

  // Build where conditions
  const conditions = [eq(orders.userId, userId)];
  
  if (status === "active") {
    // Active: pending, confirmed, preparing, ready, delivering
    conditions.push(
      sql`${orders.status} IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering')`
    );
  } else if (status === "archive") {
    // Archive: delivered, cancelled
    conditions.push(
      sql`${orders.status} IN ('delivered', 'cancelled')`
    );
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [orderList, [{ count }]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause),
  ]);

  // Get items for each order
  const ordersWithItems = await Promise.all(
    orderList.map(async (order) => {
      const items = await db
        .select({
          id: orderItems.id,
          foodId: orderItems.foodId,
          foodName: foods.nameUz,
          foodImage: foods.image,
          quantity: orderItems.quantity,
          price: orderItems.price,
          totalPrice: orderItems.totalPrice,
          notes: orderItems.notes,
        })
        .from(orderItems)
        .innerJoin(foods, eq(orderItems.foodId, foods.id))
        .where(eq(orderItems.orderId, order.id));

      return { ...order, items };
    })
  );

  return { orders: ordersWithItems, total: count };
};

export const cancelOrder = async (orderId: number, userId: number) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.status !== "pending" && order.status !== "confirmed") {
    throw ApiError.badRequest("Order cannot be cancelled at this stage");
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return updatedOrder;
};
