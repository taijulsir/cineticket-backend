// src/utils/crypto.ts
import crypto from "crypto";
import bcrypt from "bcrypt";

// Generate cryptographically strong random string
export const randomString = (length = 32): string =>
  crypto.randomBytes(length).toString("hex");

// Bcrypt helpers (already used in models)
export const hashPassword = async (plain: string): Promise<string> =>
  bcrypt.hash(plain, 10);

export const comparePassword = async (plain: string, hashed: string): Promise<boolean> =>
  bcrypt.compare(plain, hashed);

// AES-256-GCM Encryption for short sensitive data (tokens, emails, etc.)
const ENC_ALGO = "aes-256-gcm";
const ENC_KEY = crypto.createHash("sha256").update(process.env.ENCRYPTION_SECRET || "movieflex-key").digest();

export const encrypt = (plain: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decrypt = (encoded: string) => {
  const buffer = Buffer.from(encoded, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const decipher = crypto.createDecipheriv(ENC_ALGO, ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
};

// Simple SHA256 hash (for non-password data)
export const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");
