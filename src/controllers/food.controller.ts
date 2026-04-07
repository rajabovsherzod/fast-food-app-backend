import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import * as foodService from "@/services/food.service";
import { getPaginationParams } from "@/utils/pagination.utils";

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await foodService.getAllCategories();
  res.json(ApiResponse.success(categories, "Categories fetched successfully"));
});

export const getFoodsByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.categoryId);
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);

    const { foods, total } = await foodService.getFoodsByCategory(
      categoryId,
      page,
      limit
    );

    res.json(
      ApiResponse.paginated(foods, page, limit, total, "Foods fetched successfully")
    );
  }
);

export const getAllFoods = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationParams(req.query.page, req.query.limit);

  const { foods, total } = await foodService.getAllFoods(page, limit);

  res.json(
    ApiResponse.paginated(foods, page, limit, total, "Foods fetched successfully")
  );
});

export const getFoodById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const food = await foodService.getFoodById(id);
  res.json(ApiResponse.success(food, "Food fetched successfully"));
});

export const getAddons = asyncHandler(async (req: Request, res: Response) => {
  const addons = await foodService.getAllAddons();
  res.json(ApiResponse.success(addons, "Addons fetched successfully"));
});
