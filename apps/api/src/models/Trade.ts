import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
  marketId: { type: String, index: true, required: true },
  selectionId: { type: String, index: true, required: true },
  price: { type: Number, required: true },
  stake: { type: Number, required: true },
  backOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  layOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  backUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  layUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export const Trade = mongoose.model("Trade", tradeSchema);
