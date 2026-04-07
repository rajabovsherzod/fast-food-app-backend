import { z } from "zod";
export const createOrderSchema = z.object({
    body: z.object({
        items: z
            .array(z.object({
            foodId: z.number().int().positive(),
            quantity: z.number().int().positive(),
            notes: z.string().optional(),
            addons: z
                .array(z.object({
                addonId: z.number().int().positive(),
                quantity: z.number().int().positive(),
            }))
                .optional(),
        }))
            .min(1, "At least one item is required"),
        deliveryAddress: z.string().min(5, "Delivery address is required"),
        deliveryLatitude: z.string().optional(),
        deliveryLongitude: z.string().optional(),
        phoneNumber: z.string().regex(/^\+998\d{9}$/, "Invalid phone number format"),
        notes: z.string().optional(),
        promoCodeId: z.number().int().positive().optional(),
        paymentMethod: z.enum(["cash", "card", "click", "payme"]).optional(),
    }),
});
