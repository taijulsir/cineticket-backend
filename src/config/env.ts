import dotenv from "dotenv";
dotenv.config();

export const ENV = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 5000,
    APP_URL: process.env.APP_URL || "http://localhost:3000",
    BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || "http://localhost:5000",
    MONGO_URI: process.env.MONGO_URI || "",
    JWT_SECRET: process.env.JWT_SECRET || "jwtsecret1122",
};