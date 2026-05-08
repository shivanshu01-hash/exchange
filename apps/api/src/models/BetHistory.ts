import mongoose from "mongoose";

const betHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  marketId: { type: String, index: true, required: true },
  selectionId: { type: String, required: true },
  side: { type: String, enum: ["BACK", "LAY"], required: true },
  stake: Number,
  price: Number,
  grossPnl: Number,
  commission: Number,
  netPnl: Number,
  tradeId: { type: mongoose.Schema.Types.ObjectId, ref: "Trade" }
}, { timestamps: true });

export const BetHistory = mongoose.model("BetHistory", betHistorySchema);
