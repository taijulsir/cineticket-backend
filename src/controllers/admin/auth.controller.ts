// src/controllers/admin/auth.controller.ts
import Admin from "#models/admin.model.js";
import Permission from "#models/permission.model.js";
import RefreshToken from "#models/refreshToken.model.js";
import { signAccessToken, signRefreshToken } from "#utils/jwt.js";
import { setAuthCookies, clearAuthCookies } from "#utils/cookies.js";
import { makeCsrfToken } from "#utils/csrf.js";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_DAYS = 30;

const fetchPermissionNames = async (ids: string[]) => {
  if (!ids?.length) return [];
  const rows = await Permission.find({ _id: { $in: ids } }, { name: 1 });
  return rows.map(r => r.name);
};

export const adminRegister = async (req, res) => {
  // Only superadmin can register new admins
  if (!req.auth || req.auth.typ !== "admin" || req.auth.role !== "superadmin")
    return res.status(403).json({ message: "Only superadmin can register admins" });

  const { name, email, password, role } = req.body;
  const exists = await Admin.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already used" });

  const admin = await Admin.create({ name, email, password, role: role || "admin" });
  res.status(201).json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin || !(await admin.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  if (!admin.isActive) return res.status(403).json({ message: "Account disabled" });

  const permNames = await fetchPermissionNames(admin.permissionIds as any);

  const jti = randomUUID();
  const access = signAccessToken({ sub: admin.id, typ: "admin", role: admin.role, perms: permNames, jti });
  const refresh = signRefreshToken({ sub: admin.id, typ: "admin", role: admin.role, perms: permNames, jti });

  await RefreshToken.create({
    subjectType: "admin", subjectId: admin.id, tokenId: jti,
    expiresAt: dayjs().add(REFRESH_DAYS, "day").toDate(),
    ip: req.ip, userAgent: req.get("user-agent") || ""
  });

  const csrf = makeCsrfToken();
  setAuthCookies(res, { access, refresh, csrf });

  res.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, perms: permNames });
};

export const adminMe = async (req, res) => {
  if (!req.auth) return res.status(401).json({ message: "Unauthorized" });
  const admin = await Admin.findById(req.auth.id).select("name email role permissionIds");
  res.json({ admin });
};

export const adminLogout = async (_req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
};

export const adminRefresh = async (req, res) => {
  const rt = req.cookies?.refresh_token;
  if (!rt) return res.status(401).json({ message: "Missing refresh" });
  const { sub, jti, typ } = (await import("#utils/jwt.js")).verifyRefreshToken(rt);

  const tokenRow = await RefreshToken.findOne({ tokenId: jti, subjectType: "admin", isRevoked: false });
  if (!tokenRow) return res.status(401).json({ message: "Refresh revoked" });

  const admin = await Admin.findById(sub);
  if (!admin) return res.status(401).json({ message: "Account missing" });

  const permNames = await fetchPermissionNames(admin.permissionIds as any);

  // rotate
  tokenRow.isRevoked = true; await tokenRow.save();
  const newJti = randomUUID();
  const access = signAccessToken({ sub: admin.id, typ: "admin", role: admin.role, perms: permNames, jti: newJti });
  const refresh = signRefreshToken({ sub: admin.id, typ: "admin", role: admin.role, perms: permNames, jti: newJti });
  await RefreshToken.create({
    subjectType: "admin", subjectId: admin.id, tokenId: newJti,
    expiresAt: dayjs().add(REFRESH_DAYS,"day").toDate(),
    ip: req.ip, userAgent: req.get("user-agent") || ""
  });

  const csrf = makeCsrfToken();
  setAuthCookies(res, { access, refresh, csrf });
  res.json({ ok: true });
};
