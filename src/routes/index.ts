import { Router } from "express";
import userAuth from "./user/auth.routes.js";
import adminAuth from "./admin/auth.routes.js";

import userRoutes from "./user/index.js";
import adminRoutes from "./admin/index.js";

const router = Router();

router.use("/user", userRoutes);
router.use("/admin",adminRoutes)



export default router;
