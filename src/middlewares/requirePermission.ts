// src/middlewares/requirePermission.ts
import { Request, Response, NextFunction } from "express";

export const requirePermission = (permName: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    // superadmin shortcut
    if (req.auth?.typ === "admin" && req.auth.role === "superadmin") return next();
    const perms = req.auth?.perms || [];
    if (!perms.includes(permName)) {
      return res.status(403).json({ message: "Missing permission: " + permName });
    }
    next();
  };
