import { Router } from "express";
import * as deliveryController from "@/controllers/delivery.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import * as deliveryValidator from "@/validators/delivery.validator";

const router = Router();

// All routes require delivery authentication
router.use(authenticate);
router.use(authorize("delivery"));

// Get assigned orders
router.get("/orders", deliveryController.getAssignedOrders);

// Get order details
router.get("/orders/:id", deliveryController.getOrderDetails);

// Accept order (start delivery)
router.patch("/orders/:id/accept", deliveryController.acceptOrder);

// Complete delivery
router.patch("/orders/:id/complete", deliveryController.completeDelivery);

// Update location
router.post(
  "/orders/:id/location",
  validate(deliveryValidator.updateLocationSchema),
  deliveryController.updateLocation
);

// Get statistics
router.get("/statistics", deliveryController.getStatistics);

// Get delivery history
router.get("/history", deliveryController.getDeliveryHistory);

export default router;
