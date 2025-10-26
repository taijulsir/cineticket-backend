import { Router } from "express";
import userPublicRoutes from "./public.routes.js"
import userProtectedRoutes from "./protected.routes.js"


const router = Router();

router.use("/public", userPublicRoutes)
router.use("/protected",userProtectedRoutes)

export default router;