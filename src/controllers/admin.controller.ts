import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import * as adminService from "@/services/admin.service";
import { getPaginationParams } from "@/utils/pagination.utils";

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await adminService.getDashboardStats();
  res.json(ApiResponse.success(dashboard, "Dashboard data fetched"));
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
  const status = req.query.status as string | undefined;

  const { orders, total } = await adminService.getAllOrders(page, limit, status);
  res.json(ApiResponse.paginated(orders, page, limit, total, "Orders fetched"));
});

export const getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const order = await adminService.getOrderDetails(orderId);
  res.json(ApiResponse.success(order, "Order details fetched"));
});

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    const order = await adminService.updateOrderStatus(orderId, status);
    res.json(ApiResponse.success(order, "Order status updated"));
  }
);

export const assignDelivery = asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id);
  const { phoneNumber } = req.body;
  const order = await adminService.assignDelivery(orderId, phoneNumber);
  res.json(ApiResponse.success(order, "Delivery assigned successfully"));
});

export const getAllFoodsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
  const { foods, total } = await adminService.getAllFoodsAdmin(page, limit);
  res.json(ApiResponse.paginated(foods, page, limit, total, "Foods fetched"));
});

export const createFood = asyncHandler(async (req: Request, res: Response) => {
  const food = await adminService.createFood(req.body);
  res.status(201).json(ApiResponse.created(food, "Food created"));
});

export const updateFood = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const food = await adminService.updateFood(id, req.body);
  res.json(ApiResponse.success(food, "Food updated"));
});

export const deleteFood = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await adminService.deleteFood(id);
  res.json(ApiResponse.success(null, "Food deleted"));
});

export const toggleFoodAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { isAvailable } = req.body;
    const food = await adminService.toggleFoodAvailability(id, isAvailable);
    res.json(ApiResponse.success(food, "Food availability updated"));
  }
);

export const getAllCategoriesAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await adminService.getAllCategoriesAdmin();
    res.json(ApiResponse.success(categories, "Categories fetched"));
  }
);

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await adminService.createCategory(req.body);
  res.status(201).json(ApiResponse.created(category, "Category created"));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const category = await adminService.updateCategory(id, req.body);
  res.json(ApiResponse.success(category, "Category updated"));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await adminService.deleteCategory(id);
  res.json(ApiResponse.success(null, "Category deleted"));
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
  const { users, total } = await adminService.getAllUsers(page, limit);
  res.json(ApiResponse.paginated(users, page, limit, total, "Users fetched"));
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = await adminService.blockUser(id);
  res.json(ApiResponse.success(user, "User blocked"));
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const user = await adminService.unblockUser(id);
  res.json(ApiResponse.success(user, "User unblocked"));
});

export const getAllDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const deliveries = await adminService.getAllDeliveries();
  res.json(ApiResponse.success(deliveries, "Deliveries fetched"));
});

export const getDailyStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    const stats = await adminService.getDailyStatistics();
    res.json(ApiResponse.success(stats, "Daily statistics fetched"));
  }
);

export const getRevenueStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await adminService.getRevenueStatistics(days);
    res.json(ApiResponse.success(stats, "Revenue statistics fetched"));
  }
);

export const broadcastMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { message, imageUrl } = req.body;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }
    const result = await adminService.broadcastToUsers(
      message.trim(),
      imageUrl || null
    );
    res.json(
      ApiResponse.success(result, `Xabar yuborildi: ${result.sent}/${result.total} ta foydalanuvchi`)
    );
  }
);
