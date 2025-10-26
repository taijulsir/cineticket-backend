import { Router } from "express";
import { adminRegister, adminLogin } from "#controllers/admin/auth.controller.js";

const router = Router();

router.post("/register", adminRegister);
router.post("/login", adminLogin);

export default router;
