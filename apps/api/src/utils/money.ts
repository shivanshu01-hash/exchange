import type { Side } from "@exchange/shared";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeOdds(price: number) {
  if (price < 1.01 || price > 1000) throw Object.assign(new Error("Odds out of range"), { status: 400 });
  return Math.round(price * 100) / 100;
}

export function liability(side: Side, price: number, stake: number) {
  return roundMoney(side === "LAY" ? (price - 1) * stake : stake);
}

export function validateStake(stake: number) {
  if (!Number.isFinite(stake) || stake < 1) throw Object.assign(new Error("Minimum stake is 1"), { status: 400 });
  return roundMoney(stake);
}
