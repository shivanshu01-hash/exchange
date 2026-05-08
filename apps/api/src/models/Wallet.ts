import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true, required: true },
  balance: { type: Number, default: 0 },
  available: { type: Number, default: 0 },
  exposure: { type: Number, default: 0 },
  pnl: { type: Number, default: 0 }
}, { timestamps: true });

export const Wallet = mongoose.model("Wallet", walletSchema);
