import { Order } from "../models/Order.js";
import { placeOrder } from "./matchingEngine.js";
import { roundMoney } from "../utils/money.js";

export async function quoteCashout(userId: string, marketId: string, selectionId: string, currentOdds: number) {
  const orders = await Order.find({ userId, marketId, selectionId, status: { $in: ["MATCHED", "PARTIALLY_MATCHED"] }, matchedStake: { $gt: 0 } });
  const exposure = orders.reduce((sum, order) => {
    const entry = order.averageMatchedPrice || order.price;
    const pnl = order.side === "BACK"
      ? order.matchedStake * (currentOdds - entry) / currentOdds
      : order.matchedStake * (entry - currentOdds) / currentOdds;
    return sum + pnl;
  }, 0);
  const hedgeStake = roundMoney(Math.abs(exposure));
  const hedgeSide: "BACK" | "LAY" = exposure > 0 ? "LAY" : "BACK";
  return { marketId, selectionId, currentOdds, projectedPnl: roundMoney(exposure), hedgeSide, hedgeStake };
}

export async function executeCashout(userId: string, marketId: string, selectionId: string, currentOdds: number) {
  const quote = await quoteCashout(userId, marketId, selectionId, currentOdds);
  if (quote.hedgeStake < 1) return { quote, order: null };
  const order = await placeOrder(userId, {
    marketId,
    selectionId,
    side: quote.hedgeSide,
    price: currentOdds,
    stake: quote.hedgeStake,
    clientOrderId: `cashout-${Date.now()}`
  });
  return { quote, order };
}
