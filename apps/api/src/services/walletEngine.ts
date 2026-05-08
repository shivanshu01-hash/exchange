import mongoose from "mongoose";
import { pub, keys, withLock } from "../db/redis.js";
import { Transaction } from "../models/Transaction.js";
import { Wallet } from "../models/Wallet.js";
import { roundMoney } from "../utils/money.js";

export async function ensureWallet(userId: string) {
  return Wallet.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, balance: 0, available: 0, exposure: 0, pnl: 0 } },
    { upsert: true, new: true }
  );
}

export async function creditWallet(userId: string, amount: number, type: "DEPOSIT" | "SETTLEMENT" | "EXPOSURE_RELEASE", refId?: string, session?: mongoose.ClientSession) {
  return mutateWallet(userId, amount, 0, type, refId, session);
}

export async function debitWallet(userId: string, amount: number, type: "WITHDRAW" | "COMMISSION", refId?: string, session?: mongoose.ClientSession) {
  return mutateWallet(userId, -amount, 0, type, refId, session);
}

export async function lockExposure(userId: string, amount: number, refId: string, session?: mongoose.ClientSession) {
  if (amount <= 0) return ensureWallet(userId);
  return withLock(`wallet:${userId}`, 5000, async () => {
    const wallet = await ensureWallet(userId);
    if (wallet.available < amount) throw Object.assign(new Error("Insufficient available balance"), { status: 402 });
    wallet.available = roundMoney(wallet.available - amount);
    wallet.exposure = roundMoney(wallet.exposure + amount);
    await wallet.save({ session });
    await Transaction.create([{ userId, type: "EXPOSURE_LOCK", amount: -amount, balanceAfter: wallet.balance, refId }], { session });
    await pub.publish(keys.walletChannel, JSON.stringify({ userId, wallet }));
    return wallet;
  });
}

export async function releaseExposure(userId: string, amount: number, refId: string, session?: mongoose.ClientSession) {
  if (amount <= 0) return ensureWallet(userId);
  return withLock(`wallet:${userId}`, 5000, async () => {
    const wallet = await ensureWallet(userId);
    wallet.available = roundMoney(wallet.available + amount);
    wallet.exposure = roundMoney(Math.max(0, wallet.exposure - amount));
    await wallet.save({ session });
    await Transaction.create([{ userId, type: "EXPOSURE_RELEASE", amount, balanceAfter: wallet.balance, refId }], { session });
    await pub.publish(keys.walletChannel, JSON.stringify({ userId, wallet }));
    return wallet;
  });
}

async function mutateWallet(userId: string, balanceDelta: number, pnlDelta: number, type: string, refId?: string, session?: mongoose.ClientSession) {
  return withLock(`wallet:${userId}`, 5000, async () => {
    const wallet = await ensureWallet(userId);
    if (balanceDelta < 0 && wallet.available < Math.abs(balanceDelta)) throw Object.assign(new Error("Insufficient funds"), { status: 402 });
    wallet.balance = roundMoney(wallet.balance + balanceDelta);
    wallet.available = roundMoney(wallet.available + balanceDelta);
    wallet.pnl = roundMoney(wallet.pnl + pnlDelta);
    await wallet.save({ session });
    await Transaction.create([{ userId, type, amount: balanceDelta, balanceAfter: wallet.balance, refId }], { session });
    await pub.publish(keys.walletChannel, JSON.stringify({ userId, wallet }));
    return wallet;
  });
}
