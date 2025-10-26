import { Router } from "express";
import userRoutes from "./user/index.js";
import adminRoutes from "./admin/index.js";

const router = Router();


router.use("/user", userRoutes);
router.use("/admin", adminRoutes);

export default router;
