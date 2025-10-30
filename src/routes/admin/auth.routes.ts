// src/routes/admin/auth.routes.ts
import { Router } from "express";
import { validate } from "#middlewares/validate.js";
import { requireAuth } from "#middlewares/requireAuth.js";
import { csrfGuard } from "#middlewares/csrfGuard.js";
import { adminRegisterSchema, adminLoginSchema } from "#validators/auth.schema.js";
import { adminLogin, adminMe, adminLogout, adminRefresh, adminRegister } from "#controllers/admin/auth.controller.js";

const r = Router();

// superadmin creates admins
r.post("/register", requireAuth("admin"), csrfGuard, validate(adminRegisterSchema), adminRegister);

r.post("/login", validate(adminLoginSchema), adminLogin);
r.get("/me", requireAuth("admin"), adminMe);
r.post("/logout", requireAuth("admin"), csrfGuard, adminLogout);
r.post("/refresh", adminRefresh);

export default r;
