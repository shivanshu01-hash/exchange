import { useEffect, useRef } from "react";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  staleAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleTime?: number; // Time before data is considered stale (for background refresh)
  enabled?: boolean;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private subscribers = new Map<string, Set<() => void>>();

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    const staleTime = options.staleTime ?? ttl / 2; // Half of TTL by default
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      staleAt: now + staleTime,
    };
    
    this.cache.set(key, entry);
    this.notifySubscribers(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.notifySubscribers(key);
  }

  clear(): void {
    this.cache.clear();
    // Notify all subscribers
    for (const key of this.subscribers.keys()) {
      this.notifySubscribers(key);
    }
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  private notifySubscribers(key: string): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback());
    }
  }

  // Garbage collection
  gc(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const globalCache = new MemoryCache();

// Hook for caching API responses
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
} {
  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (options.enabled === false) return;
    
    // Check cache first
    const cached = globalCache.get<T>(key);
    if (cached && Date.now() < cached.staleAt) {
      setState(prev => ({ ...prev, data: cached.data }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await fetcher();
      globalCache.set(key, data, options);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: cached?.data ?? null,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [key, fetcher, options.enabled]);

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await fetcher();
      globalCache.set(key, data, options);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [key, fetcher, options]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
    setState(prev => ({ ...prev, data: null }));
  }, [key]);

  // Subscribe to cache updates
  useEffect(() => {
    const unsubscribe = globalCache.subscribe(key, () => {
      const cached = globalCache.get<T>(key);
      if (cached) {
        setState(prev => ({ ...prev, data: cached.data }));
      }
    });
    
    return unsubscribe;
  }, [key]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch,
    invalidate,
  };
}

// Cache-aware API client wrapper
export function createCachedApiClient(apiClient: any) {
  const typedApiClient = apiClient as {
    get: <T>(path: string) => Promise<T>;
    post: <T>(path: string, body?: any) => Promise<T>;
  };

  return {
    ...apiClient,
    
    async getWithCache<T>(
      path: string,
      options: CacheOptions & { cacheKey?: string } = {}
    ): Promise<T> {
      const cacheKey = options.cacheKey || `api:${path}`;
      const cached = globalCache.get<T>(cacheKey);
      
      if (cached && Date.now() < cached.staleAt) {
        return cached.data;
      }
      
      const data = await typedApiClient.get<T>(path);
      globalCache.set(cacheKey, data, options);
      return data;
    },
    
    async postWithCache<T>(
      path: string,
      body: any,
      options: CacheOptions & { cacheKey?: string; invalidate?: string[] } = {}
    ): Promise<T> {
      const data = await typedApiClient.post<T>(path, body);
      
      // Invalidate related cache entries
      if (options.invalidate) {
        options.invalidate.forEach(key => globalCache.delete(key));
      }
      
      // Cache the response if needed
      if (options.cacheKey) {
        globalCache.set(options.cacheKey, data, options);
      }
      
      return data;
    },
  };
}

// Utility for cache key generation
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${prefix}:${sortedParams}`;
}

// Import useState and useCallback for the hook
import { useState, useCallback } from "react";