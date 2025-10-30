// src/routes/admin/movie.routes.ts
import { Router } from "express";
import { requireAuth } from "#middlewares/requireAuth.js";
import { requirePermission } from "#middlewares/requirePermission.js";

const r = Router();

r.post("/", requireAuth("admin"), requirePermission("movie:create"), /* controller.create */);
r.put("/:id", requireAuth("admin"), requirePermission("movie:update"), /* controller.update */);
r.delete("/:id", requireAuth("admin"), requirePermission("movie:delete"), /* controller.remove */);

export default r;
