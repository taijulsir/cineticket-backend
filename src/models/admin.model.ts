import { Document, Schema, model, Types } from "mongoose";
import bcrypt from "bcrypt";

// 1️⃣ Strong typing for your Admin document
export interface IAdmin extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  permissions?: string[];
  isModified(password: string): boolean; // allow Mongoose helper,
  createdAt?: Date;
  updatedAt?: Date;
}

// 2️⃣ Define Schema with type parameter
const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
    permissions: [String],
  },
  { timestamps: true }
);

// 3️⃣ Pre-save hook with correct context type
AdminSchema.pre<IAdmin>("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const hashed = await bcrypt.hash(this.password, 10);
  this.password = hashed;
});

// 4️⃣ Export model with correct typing
const Admin = model<IAdmin>("Admin", AdminSchema);
export default Admin;
