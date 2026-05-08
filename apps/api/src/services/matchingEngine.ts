import type { PlaceOrderInput } from "@exchange/shared";
import { nanoid } from "nanoid";
import { keys, pub, redis, withLock } from "../db/redis.js";
import { Market } from "../models/Market.js";
import { Order } from "../models/Order.js";
import { Trade } from "../models/Trade.js";
import { assertRiskAllowed } from "./riskEngine.js";
import { liability, normalizeOdds, roundMoney, validateStake } from "../utils/money.js";
import { lockExposure, releaseExposure } from "./walletEngine.js";

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  const price = normalizeOdds(input.price);
  const stake = validateStake(input.stake);
  const exposure = liability(input.side, price, stake);
  const market = await Market.findOne({ marketId: input.marketId });
  if (!market || market.status !== "OPEN") throw Object.assign(new Error("Market is not open"), { status: 409 });
  if (!market.runners.some((runner) => runner.selectionId === input.selectionId && runner.status === "ACTIVE")) {
    throw Object.assign(new Error("Runner is not active"), { status: 409 });
  }
  await assertRiskAllowed(userId, input.marketId, exposure);

  return withLock(`book:${input.marketId}:${input.selectionId}`, 5000, async () => {
    const order = await Order.create({
      userId,
      marketId: input.marketId,
      selectionId: input.selectionId,
      side: input.side,
      price,
      stake,
      remainingStake: stake,
      liability: exposure,
      clientOrderId: input.clientOrderId || nanoid()
    });
    await lockExposure(userId, exposure, String(order._id));
    await matchOrder(String(order._id));
    return Order.findById(order._id);
  });
}

export async function cancelOrder(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, userId, status: { $in: ["OPEN", "PARTIALLY_MATCHED"] } });
  if (!order) throw Object.assign(new Error("Open order not found"), { status: 404 });
  return withLock(`book:${order.marketId}:${order.selectionId}`, 5000, async () => {
    order.status = "CANCELLED";
    const release = liability(order.side, order.price, order.remainingStake);
    order.remainingStake = 0;
    await order.save();
    await removeFromBook(String(order._id), order.marketId, order.selectionId, order.side);
    await releaseExposure(userId, release, String(order._id));
    return order;
  });
}

async function matchOrder(orderId: string) {
  const incoming = await Order.findById(orderId);
  if (!incoming || incoming.remainingStake <= 0) return;

  const oppositeSide = incoming.side === "BACK" ? "LAY" : "BACK";
  const candidates = await Order.find({
    marketId: incoming.marketId,
    selectionId: incoming.selectionId,
    side: oppositeSide,
    status: { $in: ["OPEN", "PARTIALLY_MATCHED"] },
    userId: { $ne: incoming.userId },
    price: incoming.side === "BACK" ? { $lte: incoming.price } : { $gte: incoming.price }
  }).sort({ price: incoming.side === "BACK" ? 1 : -1, createdAt: 1 }).limit(50);

  for (const resting of candidates) {
    if (incoming.remainingStake <= 0) break;
    const matchedStake = roundMoney(Math.min(incoming.remainingStake, resting.remainingStake));
    const tradePrice = resting.price;
    const backOrder = incoming.side === "BACK" ? incoming : resting;
    const layOrder = incoming.side === "LAY" ? incoming : resting;
    const trade = await Trade.create({
      marketId: incoming.marketId,
      selectionId: incoming.selectionId,
      price: tradePrice,
      stake: matchedStake,
      backOrderId: backOrder._id,
      layOrderId: layOrder._id,
      backUserId: backOrder.userId,
      layUserId: layOrder.userId
    });

    applyMatch(incoming, matchedStake, tradePrice);
    applyMatch(resting, matchedStake, tradePrice);
    await incoming.save();
    await resting.save();
    await pub.publish(keys.tradeChannel, JSON.stringify(trade));
  }

  if (incoming.remainingStake > 0) await addToBook(String(incoming._id), incoming.marketId, incoming.selectionId, incoming.side, incoming.price, incoming.createdAt.getTime());
}

function applyMatch(order: any, stake: number, price: number) {
  const weighted = ((order.averageMatchedPrice || 0) * order.matchedStake) + (price * stake);
  order.matchedStake = roundMoney(order.matchedStake + stake);
  order.remainingStake = roundMoney(order.remainingStake - stake);
  order.averageMatchedPrice = roundMoney(weighted / order.matchedStake);
  order.status = order.remainingStake <= 0 ? "MATCHED" : "PARTIALLY_MATCHED";
}

async function addToBook(orderId: string, marketId: string, selectionId: string, side: string, price: number, createdAt: number) {
  const key = side === "BACK" ? keys.orderBookBack(marketId, selectionId) : keys.orderBookLay(marketId, selectionId);
  const score = side === "BACK" ? -price * 1e13 + createdAt : price * 1e13 + createdAt;
  await redis.zadd(key, score, orderId);
}

async function removeFromBook(orderId: string, marketId: string, selectionId: string, side: string) {
  const key = side === "BACK" ? keys.orderBookBack(marketId, selectionId) : keys.orderBookLay(marketId, selectionId);
  await redis.zrem(key, orderId);
}
