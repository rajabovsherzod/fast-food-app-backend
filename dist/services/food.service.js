import { eq, and, desc, sql } from "drizzle-orm";
import db from "@/db";
import { foods, categories, addons, foodAddons } from "@/db/schema";
import ApiError from "@/utils/ApiError";
import { getOffset } from "@/utils/pagination.utils";
export const getAllCategories = async () => {
    return await db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(categories.sortOrder, categories.id);
};
export const getFoodsByCategory = async (categoryId, page, limit) => {
    const offset = getOffset(page, limit);
    const [foodList, [{ count }]] = await Promise.all([
        db
            .select()
            .from(foods)
            .where(and(eq(foods.categoryId, categoryId), eq(foods.isActive, true), eq(foods.isAvailable, true)))
            .orderBy(foods.sortOrder, desc(foods.createdAt))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql `count(*)::int` })
            .from(foods)
            .where(and(eq(foods.categoryId, categoryId), eq(foods.isActive, true), eq(foods.isAvailable, true))),
    ]);
    return { foods: foodList, total: count };
};
export const getAllFoods = async (page, limit) => {
    const offset = getOffset(page, limit);
    const [foodList, [{ count }]] = await Promise.all([
        db
            .select({
            id: foods.id,
            nameUz: foods.nameUz,
            nameRu: foods.nameRu,
            nameEn: foods.nameEn,
            descriptionUz: foods.descriptionUz,
            descriptionRu: foods.descriptionRu,
            descriptionEn: foods.descriptionEn,
            price: foods.price,
            image: foods.image,
            preparationTime: foods.preparationTime,
            ingredients: foods.ingredients,
            isAvailable: foods.isAvailable,
            categoryId: foods.categoryId,
            categoryName: categories.nameUz,
        })
            .from(foods)
            .leftJoin(categories, eq(foods.categoryId, categories.id))
            .where(and(eq(foods.isActive, true), eq(foods.isAvailable, true)))
            .orderBy(foods.sortOrder, desc(foods.createdAt))
            .limit(limit)
            .offset(offset),
        db
            .select({ count: sql `count(*)::int` })
            .from(foods)
            .where(and(eq(foods.isActive, true), eq(foods.isAvailable, true))),
    ]);
    return { foods: foodList, total: count };
};
export const getFoodById = async (id) => {
    const [food] = await db
        .select({
        id: foods.id,
        nameUz: foods.nameUz,
        nameRu: foods.nameRu,
        nameEn: foods.nameEn,
        descriptionUz: foods.descriptionUz,
        descriptionRu: foods.descriptionRu,
        descriptionEn: foods.descriptionEn,
        price: foods.price,
        image: foods.image,
        preparationTime: foods.preparationTime,
        ingredients: foods.ingredients,
        isAvailable: foods.isAvailable,
        categoryId: foods.categoryId,
        categoryName: categories.nameUz,
    })
        .from(foods)
        .leftJoin(categories, eq(foods.categoryId, categories.id))
        .where(eq(foods.id, id));
    if (!food) {
        throw ApiError.notFound("Food not found");
    }
    // Get available addons for this food
    const availableAddons = await db
        .select({
        id: addons.id,
        nameUz: addons.nameUz,
        nameRu: addons.nameRu,
        nameEn: addons.nameEn,
        price: addons.price,
        image: addons.image,
    })
        .from(foodAddons)
        .innerJoin(addons, eq(foodAddons.addonId, addons.id))
        .where(and(eq(foodAddons.foodId, id), eq(addons.isActive, true), eq(addons.isAvailable, true)));
    return { ...food, addons: availableAddons };
};
export const getAllAddons = async () => {
    return await db
        .select()
        .from(addons)
        .where(and(eq(addons.isActive, true), eq(addons.isAvailable, true)));
};
