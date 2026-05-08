import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
  status: { type: String, enum: ["ACTIVE", "SUSPENDED"], default: "ACTIVE" }
}, { timestamps: true });

export interface IUser extends mongoose.Document {
  email: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}

export const User = mongoose.model<IUser>("User", userSchema);
