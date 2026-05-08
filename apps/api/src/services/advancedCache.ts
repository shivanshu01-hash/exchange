import { redis, pub } from "../db/redis.js";
import type { MarketSnapshot } from "@exchange/shared";

export interface CacheOptions {
  ttlSeconds?: number;
  staleWhileRevalidate?: number;
  tags?: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  tags?: string[];
  version: number;
}

export class AdvancedCache {
  protected prefix = "cache:";
  protected defaultTTL = 300; // 5 minutes

  /**
   * Get cached data with stale-while-revalidate pattern
   */
  async get<T>(key: string): Promise<{ data: T; stale: boolean } | null> {
    const cacheKey = `${this.prefix}${key}`;
    const raw = await redis.get(cacheKey);
    
    if (!raw) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      const now = Date.now();
      
      // Check if expired
      if (now >= entry.expiresAt) {
        // Data is expired, but we might still return it if we have staleWhileRevalidate
        return { data: entry.data, stale: true };
      }
      
      return { data: entry.data, stale: false };
    } catch (error) {
      console.error(`Failed to parse cache entry for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache with options
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = `${this.prefix}${key}`;
    const now = Date.now();
    const ttl = options.ttlSeconds ?? this.defaultTTL;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl * 1000),
      tags: options.tags,
      version: 1,
    };

    await redis.set(cacheKey, JSON.stringify(entry), "EX", ttl);
    
    // Store tag relationships
    if (options.tags?.length) {
      await this.addTagsToKey(cacheKey, options.tags);
    }
  }

  /**
   * Get or fetch data with caching
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    
    if (cached && !cached.stale) {
      // Return fresh data
      return cached.data;
    }
    
    if (cached?.stale && options.staleWhileRevalidate) {
      // Return stale data immediately while fetching fresh data in background
      this.refreshInBackground(key, fetcher, options);
      return cached.data;
    }
    
    // Fetch fresh data
    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Refresh data in background for stale-while-revalidate
   */
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.set(key, data, options);
    } catch (error) {
      console.error(`Background refresh failed for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache by key
   */
  async invalidate(key: string): Promise<void> {
    const cacheKey = `${this.prefix}${key}`;
    await redis.del(cacheKey);
    
    // Also remove tag relationships
    await redis.del(`${cacheKey}:tags`);
  }

  /**
   * Invalidate cache by tag (bulk invalidation)
   */
  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const keys = await redis.smembers(tagKey);
    
    if (keys.length) {
      await redis.del(...keys);
      // Also delete the tag relationships
      for (const key of keys) {
        await redis.del(`${key}:tags`);
      }
    }
    
    await redis.del(tagKey);
  }

  /**
   * Add tags to a cache key for relationship tracking
   */
  private async addTagsToKey(cacheKey: string, tags: string[]): Promise<void> {
    // Store tags for this key
    await redis.sadd(`${cacheKey}:tags`, ...tags);
    
    // Store key in each tag's set
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      await redis.sadd(tagKey, cacheKey);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    const info = await redis.info("memory");
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    
    // Count cache keys
    const keys = await redis.keys(`${this.prefix}*`);
    
    return {
      totalKeys: keys.length,
      memoryUsage: memoryMatch ? memoryMatch[1] : "unknown",
    };
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    const keys = await redis.keys(`${this.prefix}*`);
    if (keys.length) {
      await redis.del(...keys);
    }
    
    // Also clear tag indexes
    const tagKeys = await redis.keys("tag:*");
    if (tagKeys.length) {
      await redis.del(...tagKeys);
    }
  }
}

// Market-specific cache utilities
export class MarketCache extends AdvancedCache {
  constructor() {
    super();
    this.prefix = "market:cache:";
    this.defaultTTL = 60; // 1 minute for market data (frequent updates)
  }

  async getMarketSnapshot(marketId: string): Promise<MarketSnapshot | null> {
    const result = await this.get<MarketSnapshot>(`snapshot:${marketId}`);
    return result?.data ?? null;
  }

  async setMarketSnapshot(snapshot: MarketSnapshot): Promise<void> {
    await this.set(`snapshot:${snapshot.marketId}`, snapshot, {
      ttlSeconds: 60, // 1 minute TTL for market data
      tags: [`market:${snapshot.marketId}`, "market-snapshots"],
    });
    
    // Publish update via Redis pub/sub
    await pub.publish("market:updates", JSON.stringify({
      type: "snapshot",
      marketId: snapshot.marketId,
      timestamp: Date.now(),
    }));
  }

  async invalidateMarket(marketId: string): Promise<void> {
    await this.invalidateByTag(`market:${marketId}`);
  }

  async warmMarketCache(marketIds: string[]): Promise<void> {
    // This would be called by a background job to pre-fetch market data
    console.log(`Warming cache for ${marketIds.length} markets`);
    
    // In a real implementation, this would fetch market data
    // and populate the cache before users request it
  }
}

// Cricket data cache with longer TTLs
export class CricketCache extends AdvancedCache {
  constructor() {
    super();
    this.prefix = "cricket:cache:";
    this.defaultTTL = 300; // 5 minutes default
  }

  async getMatchInfo(matchId: string): Promise<any | null> {
    return (await this.get<any>(`match:${matchId}`))?.data ?? null;
  }

  async setMatchInfo(matchId: string, data: any): Promise<void> {
    await this.set(`match:${matchId}`, data, {
      ttlSeconds: 600, // 10 minutes for match info
      tags: [`match:${matchId}`, "cricket-data"],
    });
  }

  async getLiveMatches(): Promise<any[] | null> {
    return (await this.get<any[]>("live-matches"))?.data ?? null;
  }

  async setLiveMatches(data: any[]): Promise<void> {
    await this.set("live-matches", data, {
      ttlSeconds: 30, // 30 seconds for live matches (frequent updates)
      staleWhileRevalidate: 10, // Serve stale data for up to 10 seconds while refreshing
      tags: ["live-matches", "cricket-data"],
    });
  }
}

// Export singleton instances
export const advancedCache = new AdvancedCache();
export const marketCache = new MarketCache();
export const cricketCache = new CricketCache();