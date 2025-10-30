// src/models/permission.model.ts
import { Schema, model } from "mongoose";

const PermissionSchema = new Schema({
    name: { type: String, unique: true, index: true, required: true }, // e.g. "movie:create"
    description: String,
    module: { type: String, required: true }, // e.g. "movie"
    action: { type: String, enum: ["create", "read", "update", "delete"], required: true }, // e.g. "create"
}, { timestamps: true });

PermissionSchema.index({ module: 1, action: 1 }, { unique: true });

const Permission = model("Permission", PermissionSchema);
export default Permission;

