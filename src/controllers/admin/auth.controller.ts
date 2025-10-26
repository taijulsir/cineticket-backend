import { Request, Response } from "express";
import Admin, { IAdmin } from "#models/admin.model.js";
import bcrypt from "bcrypt";
import { signToken } from "#utils/jwt.js";

// -----------------------------
// 🟢 Admin Register
// -----------------------------
export const adminRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      res.status(400).json({ message: "Email already used" });
      return;
    }

    const admin: IAdmin = await Admin.create({ name, email, password, role });

    // Generate token with extra "role" flag
    const token = signToken({ id: admin._id, role: admin.role }, true);

    res.status(201).json({ admin, token });
  } catch (error) {
    console.error("Admin Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------
// 🔵 Admin Login
// -----------------------------
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = signToken({ id: admin._id, role: admin.role }, true);

    res.json({ admin, token });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
