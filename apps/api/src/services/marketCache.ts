import type { MarketSnapshot } from "@exchange/shared";
import { marketCache } from "./advancedCache.js";

export async function getMarketSnapshot(marketId: string) {
  return marketCache.getMarketSnapshot(marketId);
}

export async function setMarketSnapshot(snapshot: MarketSnapshot) {
  await marketCache.setMarketSnapshot(snapshot);
}

export async function listCachedMarkets() {
  // This would need to be implemented differently with the new cache structure
  // For now, we'll keep the old implementation but note it needs updating
  const { redis } = await import("../db/redis.js");
  const marketKeys = await redis.keys("market:*");
  const values = marketKeys.length ? await redis.mget(marketKeys) : [];
  return values.filter(Boolean).map((value: string | null) => JSON.parse(value as string) as MarketSnapshot);
}

export async function invalidateMarketCache(marketId: string) {
  await marketCache.invalidateMarket(marketId);
}

export async function getMarketSnapshotWithCache(
  marketId: string,
  fetcher: () => Promise<MarketSnapshot>
): Promise<MarketSnapshot> {
  return marketCache.fetch(
    `snapshot:${marketId}`,
    fetcher,
    { ttlSeconds: 60, tags: [`market:${marketId}`] }
  );
}
