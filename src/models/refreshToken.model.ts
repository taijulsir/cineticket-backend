// src/models/refreshToken.model.ts
import { Schema, model } from "mongoose";

const RefreshTokenSchema = new Schema({
  subjectType: { type: String, enum: ["user","admin"], required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
  tokenId: { type: String, unique: true, index: true }, // jti or random id
  isRevoked: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, index: true },
  ip: String,
  userAgent: String
}, { timestamps: true });

export default model("RefreshToken", RefreshTokenSchema);
