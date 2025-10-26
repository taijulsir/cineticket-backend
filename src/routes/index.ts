import { Router } from "express";
import userAuth from "./user/auth.routes.js";
import adminAuth from "./admin/auth.routes.js";

const router = Router();

router.use("/auth", userAuth);
router.use("/admin/auth", adminAuth);

export default router;
