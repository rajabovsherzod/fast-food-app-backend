import { z } from "zod";
export const updateDeliveryStatusSchema = z.object({
    body: z.object({
        status: z.enum(["delivering", "delivered"]),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/, "Invalid order ID"),
    }),
});
export const updateLocationSchema = z.object({
    body: z.object({
        latitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid latitude"),
        longitude: z.string().regex(/^-?\d+(\.\d+)?$/, "Invalid longitude"),
    }),
});
