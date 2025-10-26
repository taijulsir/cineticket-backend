import { Router } from "express";
import userAuth from "./auth.routes.js"

const router = Router();

router.use("/auth", userAuth);

export default router;