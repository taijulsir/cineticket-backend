import User from "#models/User.js";
import bcrypt from "bcrypt";
import { signToken } from "#utils/jwt.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already used" });
  const user = await User.create({ name, email, password });
  const token = signToken({ id: user._id });
  res.json({ user, token });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });
  const token = signToken({ id: user._id });
  res.json({ user, token });
};
