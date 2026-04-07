import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import * as orderService from "@/services/order.service";
import { getPaginationParams } from "@/utils/pagination.utils";
export const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const order = await orderService.createOrder({ ...req.body, userId });
    res.status(201).json(ApiResponse.created(order, "Order created successfully"));
});
export const getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
    const { orders, total } = await orderService.getUserOrders(userId, page, limit);
    res.json(ApiResponse.paginated(orders, page, limit, total, "Orders fetched successfully"));
});
export const getOrderById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const order = await orderService.getOrderById(orderId, userId);
    res.json(ApiResponse.success(order, "Order fetched successfully"));
});
export const cancelOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const order = await orderService.cancelOrder(orderId, userId);
    res.json(ApiResponse.success(order, "Order cancelled successfully"));
});
