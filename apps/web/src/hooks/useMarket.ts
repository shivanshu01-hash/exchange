/**
 * Custom hook for market-related operations
 */

import { useEffect, useCallback, useState } from 'react';
import { useExchangeStore } from '../store/exchange';
import { apiClient } from '../services/api-client';
import { useSocket } from '../services/socket';
import { MarketSnapshot } from '../types';
import { CONSTANTS } from '../constants';

export function useMarket(marketId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();
  const { markets, setMarket, updateMarket } = useExchangeStore();
  
  // Find the specific market from the store
  const market = markets[marketId];

  // Fetch market snapshot
  const fetchMarket = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const snapshot = await apiClient.get<MarketSnapshot>(`/markets/${marketId}/snapshot`);
      setMarket(snapshot);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch market');
      console.error('Error fetching market:', err);
    } finally {
      setLoading(false);
    }
  }, [marketId, setMarket]);

  // Subscribe to market updates
  const subscribeToMarket = useCallback(() => {
    if (socket && socket.isConnected()) {
      socket.subscribeToMarket(marketId);
    }
  }, [socket, marketId]);

  // Unsubscribe from market updates
  const unsubscribeFromMarket = useCallback(() => {
    if (socket && socket.isConnected()) {
      socket.unsubscribeFromMarket(marketId);
    }
  }, [socket, marketId]);

  // Handle market updates from socket
  useEffect(() => {
    if (!socket) return;

    const handleMarketUpdate = (data: MarketSnapshot) => {
      if (data.marketId === marketId) {
        updateMarket(marketId, data);
      }
    };

    socket.on(CONSTANTS.SOCKET.MARKET.UPDATE, handleMarketUpdate);

    return () => {
      socket.off(CONSTANTS.SOCKET.MARKET.UPDATE, handleMarketUpdate);
    };
  }, [socket, marketId, updateMarket]);

  // Initial fetch and subscription
  useEffect(() => {
    fetchMarket();
    subscribeToMarket();

    return () => {
      unsubscribeFromMarket();
    };
  }, [fetchMarket, subscribeToMarket, unsubscribeFromMarket]);

  // Refresh market data
  const refresh = useCallback(() => {
    fetchMarket();
  }, [fetchMarket]);

  return {
    market,
    loading,
    error,
    refresh,
    isSubscribed: socket?.isConnected() || false,
    subscribe: subscribeToMarket,
    unsubscribe: unsubscribeFromMarket,
  };
}

export function useMarketList(filters?: {
  status?: string[];
  sport?: string;
  inPlay?: boolean;
}) {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      if (filters?.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.sport) {
        params.append('sport', filters.sport);
      }
      if (filters?.inPlay !== undefined) {
        params.append('inPlay', filters.inPlay.toString());
      }

      const response = await apiClient.get<any[]>(`/markets?${params.toString()}`);
      setMarkets(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch markets');
      console.error('Error fetching markets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets,
    loading,
    error,
    refresh: fetchMarkets,
  };
}