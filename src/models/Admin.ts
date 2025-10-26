import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const AdminSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin","editor","superadmin"], default: "admin" },
  permissions: [{ type: String }],
}, { timestamps: true });

AdminSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default model("Admin", AdminSchema);
