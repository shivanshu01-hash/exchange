import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  marketId: { type: String, index: true, required: true },
  selectionId: { type: String, index: true, required: true },
  side: { type: String, enum: ["BACK", "LAY"], required: true },
  price: { type: Number, required: true },
  stake: { type: Number, required: true },
  remainingStake: { type: Number, required: true },
  matchedStake: { type: Number, default: 0 },
  averageMatchedPrice: Number,
  liability: { type: Number, required: true },
  clientOrderId: { type: String, required: true },
  status: { type: String, enum: ["OPEN", "PARTIALLY_MATCHED", "MATCHED", "CANCELLED", "REJECTED"], default: "OPEN" }
}, { timestamps: true });

orderSchema.index({ userId: 1, clientOrderId: 1 }, { unique: true });

export interface IOrder extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  marketId: string;
  selectionId: string;
  side: "BACK" | "LAY";
  price: number;
  stake: number;
  remainingStake: number;
  matchedStake: number;
  averageMatchedPrice?: number;
  liability: number;
  clientOrderId: string;
  status: "OPEN" | "PARTIALLY_MATCHED" | "MATCHED" | "CANCELLED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

export const Order = mongoose.model<IOrder>("Order", orderSchema);
