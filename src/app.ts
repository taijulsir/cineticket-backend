import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import routes from "#routes/index.js";
import { errorHandler } from "#middlewares/errorHandler.js";
import { restoreSchedules } from "schedulers/movieSchedulers.js";
import { applySecurity } from "#config/security.js";

dotenv.config();

const app = express();
applySecurity(app);

app.use(cors({ origin: process.env.APP_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

restoreSchedules();

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
