import { Request, Response } from "express";
import User, { IUser } from "#models/user.model.js";
import bcrypt from "bcrypt";
import { signToken } from "#utils/jwt.js";

// -----------------------------
// 🟢 Register Controller
// -----------------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate basic fields
    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400).json({ message: "Email already used" });
      return;
    }

    // Create user
    const user: IUser = await User.create({ name, email, password });

    // Generate JWT
    const token = signToken({ id: user._id });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// -----------------------------
// 🔵 Login Controller
// -----------------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Generate token
    const token = signToken({ id: user._id });

    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
