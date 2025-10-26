import { Document, Schema, model, Types } from "mongoose";
import bcrypt from "bcrypt";

// 1️⃣ Define a TypeScript interface for the User document
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  isModified(path: string): boolean; // for Mongoose helper,
  createdAt?: Date;
  updatedAt?: Date;
}

// 2️⃣ Define the schema with generic <IUser>
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user"], default: "user" },
  },
  { timestamps: true }
);

// 3️⃣ Pre-save hook with full type safety
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const hashed = await bcrypt.hash(this.password, 10);
  this.password = hashed;
});

// 4️⃣ Create and export the model with correct type
const User = model<IUser>("User", UserSchema);
export default User;
