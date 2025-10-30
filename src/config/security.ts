// src/config/security.ts
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Express } from "express";

/**
 * Apply global security middlewares.
 * Import and call inside app.ts
 */
export const applySecurity = (app: Express) => {
  // Helmet for secure HTTP headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    })
  );

  // CORS configuration
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "").split(",");
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    })
  );

  // Basic rate limiting to prevent brute-force
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,            // 100 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  });
  app.use(limiter);
};
