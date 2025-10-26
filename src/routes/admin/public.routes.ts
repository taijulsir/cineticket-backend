import { Router } from "express";
import adminAuth from "./auth.routes.js"

const router = Router();

router.use("/auth", adminAuth);

export default router;