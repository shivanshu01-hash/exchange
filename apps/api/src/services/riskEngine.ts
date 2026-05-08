import { env } from "../config/env.js";
import { Order } from "../models/Order.js";
import { Wallet } from "../models/Wallet.js";

export async function assertRiskAllowed(userId: string, marketId: string, liability: number) {
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.available < liability) throw Object.assign(new Error("Insufficient available balance"), { status: 402 });
  if (wallet.exposure + liability > env.MAX_USER_EXPOSURE) throw Object.assign(new Error("User exposure limit exceeded"), { status: 403 });
  const marketExposure = await Order.aggregate([
    { $match: { marketId, status: { $in: ["OPEN", "PARTIALLY_MATCHED"] } } },
    { $group: { _id: null, exposure: { $sum: "$liability" } } }
  ]);
  if ((marketExposure[0]?.exposure || 0) + liability > env.MAX_MARKET_EXPOSURE) {
    throw Object.assign(new Error("Market exposure limit exceeded"), { status: 403 });
  }
}
