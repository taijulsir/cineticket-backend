import jwt from "jsonwebtoken";

export const signToken = (payload: object, isAdmin = false) => {
  const secret = isAdmin ? process.env.ADMIN_JWT_SECRET! : process.env.JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
