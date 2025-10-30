// src/utils/csrf.ts
import crypto from "crypto";

export const makeCsrfToken = () => crypto.randomBytes(24).toString("hex");

// middleware to enforce:
export const verifyCsrf = (cookieVal?: string, headerVal?: string) =>
  !!cookieVal && !!headerVal && cookieVal === headerVal;
