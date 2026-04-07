import { Router } from "express";
import * as orderController from "@/controllers/order.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import * as orderValidator from "@/validators/order.validator";
const router = Router();
// All routes require authentication
router.use(authenticate);
// Create order
router.post("/", authorize("user"), validate(orderValidator.createOrderSchema), orderController.createOrder);
// Get user orders
router.get("/", authorize("user"), orderController.getUserOrders);
// Get order by ID
router.get("/:id", authorize("user"), orderController.getOrderById);
// Cancel order
router.patch("/:id/cancel", authorize("user"), orderController.cancelOrder);
export default router;
