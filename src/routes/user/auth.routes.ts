// src/routes/user/auth.routes.ts
import { Router } from "express";
import { validate } from "#middlewares/validate.js";
import { requireAuth } from "#middlewares/requireAuth.js";
import { csrfGuard } from "#middlewares/csrfGuard.js";
import { userRegisterSchema, userLoginSchema, googleAuthSchema } from "#validators/auth.schema.js";
import { userRegister, userLogin, userMe, userLogout, userRefresh, userLoginByGoogle } from "#controllers/user/auth.controller.js";

const r = Router();

r.post("/register", validate(userRegisterSchema), userRegister);
r.post("/login", validate(userLoginSchema), userLogin);
r.post("/google", validate(googleAuthSchema), userLoginByGoogle);

r.get("/me", requireAuth("user"), userMe);
r.post("/logout", requireAuth("user"), csrfGuard, userLogout);
r.post("/refresh", userRefresh);

export default r;
