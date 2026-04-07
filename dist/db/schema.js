import { pgTable, serial, varchar, text, integer, decimal, boolean, timestamp, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Enums
export const roleEnum = pgEnum('role', ['user', 'delivery', 'admin']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'click', 'payme']);
// Users table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    telegramId: varchar('telegram_id', { length: 100 }).unique().notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }),
    username: varchar('username', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
    role: roleEnum('role').default('user').notNull(),
    isBlocked: boolean('is_blocked').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Admin Users
export const admins = pgTable('admins', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    role: varchar('role', { length: 50 }).default('admin').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Categories table
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    nameUz: varchar('name_uz', { length: 100 }).notNull(),
    nameRu: varchar('name_ru', { length: 100 }),
    nameEn: varchar('name_en', { length: 100 }),
    image: text('image'),
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Foods table
export const foods = pgTable('foods', {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id').references(() => categories.id).notNull(),
    nameUz: varchar('name_uz', { length: 200 }).notNull(),
    nameRu: varchar('name_ru', { length: 200 }),
    nameEn: varchar('name_en', { length: 200 }),
    descriptionUz: text('description_uz'),
    descriptionRu: text('description_ru'),
    descriptionEn: text('description_en'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    image: text('image'),
    preparationTime: integer('preparation_time').notNull(),
    ingredients: json('ingredients').$type(),
    isAvailable: boolean('is_available').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Addons table
export const addons = pgTable('addons', {
    id: serial('id').primaryKey(),
    nameUz: varchar('name_uz', { length: 100 }).notNull(),
    nameRu: varchar('name_ru', { length: 100 }),
    nameEn: varchar('name_en', { length: 100 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    image: text('image'),
    isAvailable: boolean('is_available').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Food Addons
export const foodAddons = pgTable('food_addons', {
    id: serial('id').primaryKey(),
    foodId: integer('food_id').references(() => foods.id).notNull(),
    addonId: integer('addon_id').references(() => addons.id).notNull(),
});
// User Addresses
export const userAddresses = pgTable('user_addresses', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    label: varchar('label', { length: 50 }).notNull(),
    address: text('address').notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Delivery Zones
export const deliveryZones = pgTable('delivery_zones', {
    id: serial('id').primaryKey(),
    nameUz: varchar('name_uz', { length: 100 }).notNull(),
    nameRu: varchar('name_ru', { length: 100 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    coordinates: json('coordinates').$type(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Orders table
export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    deliveryId: integer('delivery_id').references(() => users.id),
    orderNumber: varchar('order_number', { length: 20 }).unique().notNull(),
    status: orderStatusEnum('status').default('pending').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').default('cash').notNull(),
    deliveryAddress: text('delivery_address').notNull(),
    deliveryLatitude: decimal('delivery_latitude', { precision: 10, scale: 8 }),
    deliveryLongitude: decimal('delivery_longitude', { precision: 11, scale: 8 }),
    phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    deliveryPrice: decimal('delivery_price', { precision: 10, scale: 2 }).notNull(),
    promoDiscount: decimal('promo_discount', { precision: 10, scale: 2 }).default('0').notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    notes: text('notes'),
    promoCodeId: integer('promo_code_id'),
    estimatedDeliveryTime: integer('estimated_delivery_time'),
    confirmedAt: timestamp('confirmed_at'),
    preparingAt: timestamp('preparing_at'),
    readyAt: timestamp('ready_at'),
    deliveringAt: timestamp('delivering_at'),
    deliveredAt: timestamp('delivered_at'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Order Items
export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id).notNull(),
    foodId: integer('food_id').references(() => foods.id).notNull(),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    notes: text('notes'),
});
// Order Item Addons
export const orderItemAddons = pgTable('order_item_addons', {
    id: serial('id').primaryKey(),
    orderItemId: integer('order_item_id').references(() => orderItems.id).notNull(),
    addonId: integer('addon_id').references(() => addons.id).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
});
// Promo Codes
export const promoCodes = pgTable('promo_codes', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 50 }).unique().notNull(),
    discountType: varchar('discount_type', { length: 20 }).notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
    maxDiscount: decimal('max_discount', { precision: 10, scale: 2 }),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').default(0).notNull(),
    validFrom: timestamp('valid_from').notNull(),
    validUntil: timestamp('valid_until').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Ratings
export const ratings = pgTable('ratings', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id).notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    foodRating: integer('food_rating'),
    deliveryRating: integer('delivery_rating'),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Notifications
export const notifications = pgTable('notifications', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    metadata: json('metadata'),
    isRead: boolean('is_read').default(false).notNull(),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
    readAt: timestamp('read_at'),
});
// Settings
export const settings = pgTable('settings', {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 100 }).unique().notNull(),
    value: text('value').notNull(),
    description: text('description'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Working Hours
export const workingHours = pgTable('working_hours', {
    id: serial('id').primaryKey(),
    dayOfWeek: integer('day_of_week').notNull(),
    openTime: varchar('open_time', { length: 5 }).notNull(),
    closeTime: varchar('close_time', { length: 5 }).notNull(),
    isOpen: boolean('is_open').default(true).notNull(),
});
// Refresh Tokens
export const refreshTokens = pgTable('refresh_tokens', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    deviceInfo: text('device_info'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Relations
export const usersRelations = relations(users, ({ many }) => ({
    orders: many(orders),
    addresses: many(userAddresses),
    ratings: many(ratings),
    notifications: many(notifications),
}));
export const categoriesRelations = relations(categories, ({ many }) => ({
    foods: many(foods),
}));
export const foodsRelations = relations(foods, ({ one, many }) => ({
    category: one(categories, {
        fields: [foods.categoryId],
        references: [categories.id],
    }),
    foodAddons: many(foodAddons),
    orderItems: many(orderItems),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    delivery: one(users, {
        fields: [orders.deliveryId],
        references: [users.id],
    }),
    orderItems: many(orderItems),
    rating: many(ratings),
}));
export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    food: one(foods, {
        fields: [orderItems.foodId],
        references: [foods.id],
    }),
    addons: many(orderItemAddons),
}));
