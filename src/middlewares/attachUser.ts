// src/middlewares/attachUser.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "#utils/jwt.js";

export type AuthCtx = {
  id: string;
  typ: "user"|"admin";
  role?: string;
  perms?: string[];
};

declare global {
  namespace Express {
    interface Request { auth?: AuthCtx }
  }
}

export const attachUser = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.access_token;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.auth = { id: payload.sub, typ: payload.typ, role: payload.role, perms: payload.perms };
  } catch {}
  next();
};
