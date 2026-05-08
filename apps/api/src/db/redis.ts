import { Redis } from "ioredis";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, enableReadyCheck: true });
export const pub = new Redis(env.REDIS_URL);
export const sub = new Redis(env.REDIS_URL);

export const keys = {
  market: (marketId: string) => `market:${marketId}`,
  orderBookBack: (marketId: string, selectionId: string) => `ob:${marketId}:${selectionId}:back`,
  orderBookLay: (marketId: string, selectionId: string) => `ob:${marketId}:${selectionId}:lay`,
  order: (orderId: string) => `order:${orderId}`,
  lock: (name: string) => `lock:${name}`,
  session: (userId: string) => `session:${userId}`,
  roomMarket: (marketId: string) => `market:${marketId}`,
  oddsChannel: "odds:update",
  tradeChannel: "trade:update",
  walletChannel: "wallet:update"
};

export async function withLock<T>(name: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const token = randomUUID();
  const lockKey = keys.lock(name);
  const acquired = await redis.set(lockKey, token, "PX", ttlMs, "NX");
  if (!acquired) throw Object.assign(new Error("Resource is locked"), { status: 409 });
  try {
    return await fn();
  } finally {
    const script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    await redis.eval(script, 1, lockKey, token);
  }
}
