import { z } from "zod";

// Category validators
export const createCategorySchema = z.object({
  body: z.object({
    nameUz: z.string().min(1, "Uzbek name is required"),
    nameRu: z.string().optional(),
    nameEn: z.string().optional(),
    image: z.string().url().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    nameUz: z.string().min(1).optional(),
    nameRu: z.string().optional(),
    nameEn: z.string().optional(),
    image: z.string().url().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid ID"),
  }),
});

// Food validators
export const createFoodSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive("Category ID is required"),
    nameUz: z.string().min(1, "Uzbek name is required"),
    nameRu: z.string().optional(),
    nameEn: z.string().optional(),
    descriptionUz: z.string().optional(),
    descriptionRu: z.string().optional(),
    descriptionEn: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
    image: z.string().optional().nullable(),
    preparationTime: z.number().int().min(1, "Preparation time must be at least 1 minute"),
    ingredients: z.array(z.string()).optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const updateFoodSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive().optional(),
    nameUz: z.string().min(1).optional(),
    nameRu: z.string().optional(),
    nameEn: z.string().optional(),
    descriptionUz: z.string().optional(),
    descriptionRu: z.string().optional(),
    descriptionEn: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    image: z.string().optional().nullable(),
    preparationTime: z.number().int().min(1).optional(),
    ingredients: z.array(z.string()).optional(),
    sortOrder: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid ID"),
  }),
});

export const toggleFoodAvailabilitySchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid ID"),
  }),
});

// Order validators
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivering",
      "delivered",
      "cancelled",
    ]),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid ID"),
  }),
});

export const assignDeliverySchema = z.object({
  body: z.object({
    phoneNumber: z.string().regex(/^\+998\d{9}$/, "Invalid phone number format (+998XXXXXXXXX)"),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid ID"),
  }),
});
