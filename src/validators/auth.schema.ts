// src/validators/auth.schema.ts
import { z } from "zod";

export const email = z.string().email();
export const password = z.string().min(6);

export const userRegisterSchema = z.object({
  body: z.object({ name: z.string().min(2), email, password })
});

export const userLoginSchema = z.object({
  body: z.object({ email, password })
});

export const adminRegisterSchema = z.object({
  body: z.object({ name: z.string(), email, password, role: z.enum(["superadmin","admin","staff"]).optional() })
});

export const adminLoginSchema = z.object({
  body: z.object({ email, password })
});

export const googleAuthSchema = z.object({
  body: z.object({ idToken: z.string() }) // Google One Tap / OAuth token
});
