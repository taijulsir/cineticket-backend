// src/utils/jwt.ts
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export type JWTPayload = {
  sub: string;
  typ: "user" | "admin";
  role?: string;
  perms?: string[];
  jti?: string;
};

// --- Secret helper ---
const getSecret = (key?: string): jwt.Secret => {
  if (!key) throw new Error("JWT secret not found");
  return key;
};

const accessSecret = getSecret(process.env.JWT_ACCESS_SECRET);
const refreshSecret = getSecret(process.env.JWT_REFRESH_SECRET);

// --- ✅ FIXED options ---
const accessOptions: SignOptions = {
  expiresIn: (process.env.ACCESS_TOKEN_TTL as unknown as jwt.SignOptions["expiresIn"]) || "15m",
};

const refreshOptions: SignOptions = {
  expiresIn: (process.env.REFRESH_TOKEN_TTL as unknown as jwt.SignOptions["expiresIn"]) || "30d",
};

// --- Token functions ---
export const signAccessToken = (payload: JWTPayload): string =>
  jwt.sign(payload, accessSecret, accessOptions);

export const signRefreshToken = (payload: JWTPayload & { jti: string }): string =>
  jwt.sign(payload, refreshSecret, refreshOptions);

export const verifyAccessToken = (token: string): JWTPayload =>
  jwt.verify(token, accessSecret) as JWTPayload;

export const verifyRefreshToken = (token: string): JWTPayload & { jti: string } =>
  jwt.verify(token, refreshSecret) as JWTPayload & { jti: string };
