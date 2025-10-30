// src/controllers/user/auth.controller.ts
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import dayjs from "dayjs";
import { randomUUID } from "crypto";

import User, { IUser } from "#models/user.model.js";
import RefreshToken from "#models/refreshToken.model.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "#utils/jwt.js";
import { setAuthCookies, clearAuthCookies } from "#utils/cookies.js";
import { makeCsrfToken } from "#utils/csrf.js";
import { comparePassword } from "#utils/crypto.js";

// --- Constants ---
const REFRESH_DAYS = 30;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- Token issuance helper ---
const issueUserTokens = async (user: IUser, req: Request, res: Response): Promise<void> => {
  const jti = randomUUID();

  const access = signAccessToken({ sub: user.id, typ: "user", jti });
  const refresh = signRefreshToken({ sub: user.id, typ: "user", jti });

  await RefreshToken.create({
    subjectType: "user",
    subjectId: user.id,
    tokenId: jti,
    expiresAt: dayjs().add(REFRESH_DAYS, "day").toDate(),
    ip: req.ip,
    userAgent: req.get("user-agent") || "",
  });

  const csrf = makeCsrfToken();
  setAuthCookies(res, { access, refresh, csrf });
};

// --- Register ---
export const userRegister = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400).json({ message: "Email already used" });
    return;
  }

  const user = await User.create({
    name,
    email,
    password,
    providers: [{ provider: "password" }],
  });

  await issueUserTokens(user, req, res);
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
};

// --- Login ---
export const userLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await comparePassword(password, user.password))) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  await issueUserTokens(user, req, res);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
};

// --- Google Login ---
export const userLoginByGoogle = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    res.status(400).json({ message: "Google token invalid" });
    return;
  }

  let user = await User.findOne({ email: payload.email });
  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
      avatarUrl: payload.picture,
      providers: [{ provider: "google", providerId: payload.sub }],
    });
  } else {
    const hasGoogle = user.providers.some((p) => p.provider === "google");
    if (!hasGoogle) {
      user.providers.push({ provider: "google", providerId: payload.sub! });
      await user.save();
    }
  }

  await issueUserTokens(user, req, res);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
};

// --- Me ---
export const userMe = async (req: Request, res: Response): Promise<void> => {
  res.json({ user: { id: (req as any).auth?.id } });
};

// --- Logout ---
export const userLogout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookies(res);
  res.json({ ok: true });
};

// --- Refresh ---
export const userRefresh = async (req: Request, res: Response): Promise<void> => {
  const rt = req.cookies?.refresh_token;
  if (!rt) {
    res.status(401).json({ message: "Missing refresh" });
    return;
  }

  const { sub, jti } = verifyRefreshToken(rt);
  const tokenRow = await RefreshToken.findOne({
    tokenId: jti,
    subjectType: "user",
    isRevoked: false,
  });

  if (!tokenRow) {
    res.status(401).json({ message: "Refresh revoked" });
    return;
  }

  const user = await User.findById(sub);
  if (!user) {
    res.status(401).json({ message: "Account missing" });
    return;
  }

  tokenRow.isRevoked = true;
  await tokenRow.save();

  const newJti = randomUUID();
  const access = signAccessToken({ sub: user.id, typ: "user", jti: newJti });
  const refresh = signRefreshToken({ sub: user.id, typ: "user", jti: newJti });

  await RefreshToken.create({
    subjectType: "user",
    subjectId: user.id,
    tokenId: newJti,
    expiresAt: dayjs().add(REFRESH_DAYS, "day").toDate(),
    ip: req.ip,
    userAgent: req.get("user-agent") || "",
  });

  const csrf = makeCsrfToken();
  setAuthCookies(res, { access, refresh, csrf });
  res.json({ ok: true });
};
