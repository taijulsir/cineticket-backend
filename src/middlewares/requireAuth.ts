// src/middlewares/requireAuth.ts
import { Request, Response, NextFunction } from "express";

export const requireAuth = (typ?: "user"|"admin") =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) return res.status(401).json({ message: "Unauthorized" });
    if (typ && req.auth.typ !== typ) return res.status(403).json({ message: "Forbidden" });
    next();
  };
