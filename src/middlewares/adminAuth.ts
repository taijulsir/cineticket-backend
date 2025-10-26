import jwt from "jsonwebtoken";
import Admin from "#models/admin.model.js";

export const verifyAdminToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Invalid admin" });
    req.admin = admin;
    next();
  } catch {
    res.status(403).json({ message: "Unauthorized" });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  const admin = req.admin;
  if (!admin || !roles.includes(admin.role)) return res.status(403).json({ message: "Access denied" });
  next();
};

export const requirePermissions = (...perms) => (req, res, next) => {
  const admin = req.admin;
  if (!admin) return res.status(401).json({ message: "Unauthorized" });
  const hasAll = perms.every((p) => admin.permissions.includes(p));
  if (!hasAll) return res.status(403).json({ message: "Permission denied" });
  next();
};
