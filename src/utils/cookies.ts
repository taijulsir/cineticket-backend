// src/utils/cookies.ts
import { Response } from "express";

const isProd = process.env.NODE_ENV === "production";
const domain = process.env.COOKIE_DOMAIN || "localhost";

export const setAuthCookies = (res: Response, tokens: { access: string; refresh: string; csrf: string; }) => {
  res.cookie("access_token", tokens.access, {
    httpOnly: true, secure: isProd, sameSite: "lax", domain, path: "/"
  });
  res.cookie("refresh_token", tokens.refresh, {
    httpOnly: true, secure: isProd, sameSite: "lax", domain, path: "/"
  });
  // CSRF token is NOT httpOnly so client can read and send in header
  res.cookie(process.env.CSRF_COOKIE_NAME || "csrf_token", tokens.csrf, {
    httpOnly: false, secure: isProd, sameSite: "lax", domain, path: "/"
  });
};

export const clearAuthCookies = (res: Response) => {
  ["access_token","refresh_token", process.env.CSRF_COOKIE_NAME || "csrf_token"]
    .forEach((name) => res.clearCookie(name, { path: "/", domain }));
};
