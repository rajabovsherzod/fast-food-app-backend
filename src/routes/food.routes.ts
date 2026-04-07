import { Router } from "express";
import * as foodController from "@/controllers/food.controller";

const router = Router();

// Public routes
router.get("/categories", foodController.getCategories);
router.get("/", foodController.getAllFoods);
router.get("/category/:categoryId", foodController.getFoodsByCategory);
router.get("/:id", foodController.getFoodById);
router.get("/addons/all", foodController.getAddons);

export default router;
