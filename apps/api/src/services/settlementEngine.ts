import { env } from "../config/env.js";
import { BetHistory } from "../models/BetHistory.js";
import { Market } from "../models/Market.js";
import { Trade } from "../models/Trade.js";
import { creditWallet, debitWallet, releaseExposure } from "./walletEngine.js";
import { roundMoney } from "../utils/money.js";

export async function settleMarket(marketId: string, winningSelectionId: string) {
  const market = await Market.findOne({ marketId });
  if (!market || market.status === "SETTLED") throw Object.assign(new Error("Market not settleable"), { status: 409 });
  market.status = "SETTLED";
  market.runners.forEach((runner) => { runner.result = runner.selectionId === winningSelectionId ? "WINNER" : "LOSER"; });
  await market.save();

  const trades = await Trade.find({ marketId });
  for (const trade of trades) {
    const backWins = trade.selectionId === winningSelectionId;
    const backGross = backWins ? trade.stake * (trade.price - 1) : -trade.stake;
    const layGross = backWins ? -trade.stake * (trade.price - 1) : trade.stake;
    await settleUser(String(trade.backUserId), String(trade._id), marketId, trade.selectionId, "BACK", trade.stake, trade.price, backGross);
    await settleUser(String(trade.layUserId), String(trade._id), marketId, trade.selectionId, "LAY", trade.stake, trade.price, layGross);
  }
  return market;
}

async function settleUser(userId: string, tradeId: string, marketId: string, selectionId: string, side: "BACK" | "LAY", stake: number, price: number, gross: number) {
  const commission = gross > 0 ? roundMoney(gross * env.COMMISSION_BPS / 10000) : 0;
  const net = roundMoney(gross - commission);
  const locked = side === "LAY" ? roundMoney((price - 1) * stake) : stake;
  await releaseExposure(userId, locked, tradeId);
  if (net >= 0) await creditWallet(userId, net, "SETTLEMENT", tradeId);
  else await debitWallet(userId, Math.abs(net), "WITHDRAW", tradeId);
  if (commission > 0) await debitWallet(userId, commission, "COMMISSION", tradeId);
  await BetHistory.create({ userId, marketId, selectionId, side, stake, price, grossPnl: gross, commission, netPnl: net, tradeId });
}
