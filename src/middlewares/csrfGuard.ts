// src/middlewares/csrfGuard.ts
import { Request, Response, NextFunction } from "express";
import { verifyCsrf } from "#utils/csrf.js";

export const csrfGuard = (req: Request, res: Response, next: NextFunction) => {
  // Only enforce on non-GET/HEAD
  if (["GET","HEAD","OPTIONS"].includes(req.method)) return next();
  const cookieVal = req.cookies?.[process.env.CSRF_COOKIE_NAME || "csrf_token"];
  const headerVal = req.header("x-csrf-token");
  if (!verifyCsrf(cookieVal, headerVal)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  next();
};
