import { Router } from "express";
import * as adminController from "@/controllers/admin.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import * as adminValidator from "@/validators/admin.validator";
const router = Router();
// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin", "super_admin", "manager"));
// Dashboard
router.get("/dashboard", adminController.getDashboard);
// Orders management
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getOrderDetails);
router.patch("/orders/:id/status", validate(adminValidator.updateOrderStatusSchema), adminController.updateOrderStatus);
router.patch("/orders/:id/assign-delivery", validate(adminValidator.assignDeliverySchema), adminController.assignDelivery);
// Foods management
router.get("/foods", adminController.getAllFoodsAdmin);
router.post("/foods", validate(adminValidator.createFoodSchema), adminController.createFood);
router.put("/foods/:id", validate(adminValidator.updateFoodSchema), adminController.updateFood);
router.delete("/foods/:id", adminController.deleteFood);
router.patch("/foods/:id/availability", validate(adminValidator.toggleFoodAvailabilitySchema), adminController.toggleFoodAvailability);
// Categories management
router.get("/categories", adminController.getAllCategoriesAdmin);
router.post("/categories", validate(adminValidator.createCategorySchema), adminController.createCategory);
router.put("/categories/:id", validate(adminValidator.updateCategorySchema), adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);
// Users management
router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/block", adminController.blockUser);
router.patch("/users/:id/unblock", adminController.unblockUser);
// Delivery management
router.get("/deliveries", adminController.getAllDeliveries);
// Statistics
router.get("/statistics/daily", adminController.getDailyStatistics);
router.get("/statistics/revenue", adminController.getRevenueStatistics);
export default router;
