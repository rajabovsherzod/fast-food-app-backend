import { Router } from "express";
import authRoutes from "./auth.routes";
import foodRoutes from "./food.routes";
import orderRoutes from "./order.routes";
import adminRoutes from "./admin.routes";
import deliveryRoutes from "./delivery.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/foods", foodRoutes);
router.use("/orders", orderRoutes);
router.use("/admin", adminRoutes);
router.use("/delivery", deliveryRoutes);
router.use("/upload", uploadRoutes);

export default router;
