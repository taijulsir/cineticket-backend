import Admin from "#models/Admin.js";
import bcrypt from "bcrypt";
import { signToken } from "#utils/jwt.js";

export const adminRegister = async (req, res) => {
  const { name, email, password, role } = req.body;
  const exists = await Admin.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already used" });
  const admin = await Admin.create({ name, email, password, role });
  const token = signToken({ id: admin._id, role: admin.role }, true);
  res.json({ admin, token });
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(400).json({ message: "Invalid credentials" });
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });
  const token = signToken({ id: admin._id, role: admin.role }, true);
  res.json({ admin, token });
};
