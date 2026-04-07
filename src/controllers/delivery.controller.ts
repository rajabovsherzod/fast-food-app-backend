import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import * as deliveryService from "@/services/delivery.service";
import { getPaginationParams } from "@/utils/pagination.utils";

export const getAssignedOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const deliveryId = req.user!.id;
    const orders = await deliveryService.getAssignedOrders(deliveryId);
    res.json(ApiResponse.success(orders, "Assigned orders fetched"));
  }
);

export const getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const deliveryId = req.user!.id;
  const orderId = parseInt(req.params.id);
  const order = await deliveryService.getOrderDetails(orderId, deliveryId);
  res.json(ApiResponse.success(order, "Order details fetched"));
});

export const acceptOrder = asyncHandler(async (req: Request, res: Response) => {
  const deliveryId = req.user!.id;
  const orderId = parseInt(req.params.id);
  const order = await deliveryService.acceptOrder(orderId, deliveryId);
  res.json(ApiResponse.success(order, "Order accepted"));
});

export const completeDelivery = asyncHandler(
  async (req: Request, res: Response) => {
    const deliveryId = req.user!.id;
    const orderId = parseInt(req.params.id);
    const order = await deliveryService.completeDelivery(orderId, deliveryId);
    res.json(ApiResponse.success(order, "Delivery completed"));
  }
);

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const deliveryId = req.user!.id;
  const orderId = parseInt(req.params.id);
  const { latitude, longitude } = req.body;
  await deliveryService.updateLocation(deliveryId, orderId, latitude, longitude);
  res.json(ApiResponse.success(null, "Location updated"));
});

export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const deliveryId = req.user!.id;
  const stats = await deliveryService.getStatistics(deliveryId);
  res.json(ApiResponse.success(stats, "Statistics fetched"));
});

export const getDeliveryHistory = asyncHandler(async (req: Request, res: Response) => {
  const deliveryId = req.user!.id;
  const { page, limit } = getPaginationParams(req.query.page, req.query.limit);
  const { history, total } = await deliveryService.getDeliveryHistory(deliveryId, page, limit);
  res.json(ApiResponse.paginated(history, page, limit, total, "Delivery history fetched"));
});
