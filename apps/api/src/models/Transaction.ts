import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  type: { type: String, enum: ["DEPOSIT", "WITHDRAW", "EXPOSURE_LOCK", "EXPOSURE_RELEASE", "SETTLEMENT", "COMMISSION"], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  refType: String,
  refId: String,
  meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export const Transaction = mongoose.model("Transaction", transactionSchema);
