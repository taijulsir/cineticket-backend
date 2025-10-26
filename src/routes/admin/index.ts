import { Router } from "express";
import adminPublicRoutes from "./public.routes.js"
import adminProtectedRoutes from "./protected.routes.js"


const router = Router();

router.use("/public", adminPublicRoutes)
router.use("/protected", adminProtectedRoutes)

export default router;