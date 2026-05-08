"use client";
import type { BalanceDto, MarketSnapshot, OrderDto, TradeDto } from "@exchange/shared";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface UserDto {
  id: string;
  email: string;
  username?: string;
  role: "USER" | "ADMIN" | "BROKER";
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  createdAt: string;
  lastLoginAt?: string;
}

interface ExchangeState {
  // Markets
  markets: Record<string, MarketSnapshot>;
  subscribedMarkets: Set<string>;
  
  // Orders
  orders: Record<string, OrderDto>;
  openOrders: string[]; // IDs of open orders
  matchedOrders: string[]; // IDs of matched orders
  
  // Trades
  trades: Record<string, TradeDto>;
  
  // User data
  wallet?: BalanceDto;
  user?: UserDto;
  
  // UI state
  selectedMarketId?: string;
  selectedRunnerId?: string;
  lastUpdatedAt: number;
  
  // Actions
  setMarket: (market: MarketSnapshot) => void;
  updateMarket: (marketId: string, updates: Partial<MarketSnapshot>) => void;
  removeMarket: (marketId: string) => void;
  
  setWallet: (wallet: BalanceDto) => void;
  updateWallet: (updates: Partial<BalanceDto>) => void;
  
  setUser: (user: UserDto) => void;
  
  addOrder: (order: OrderDto) => void;
  updateOrder: (orderId: string, updates: Partial<OrderDto>) => void;
  removeOrder: (orderId: string) => void;
  
  addTrade: (trade: TradeDto) => void;
  
  subscribeToMarket: (marketId: string) => void;
  unsubscribeFromMarket: (marketId: string) => void;
  
  setSelectedMarket: (marketId?: string) => void;
  setSelectedRunner: (runnerId?: string) => void;
  
  clearStore: () => void;
}

const initialState = {
  markets: {},
  subscribedMarkets: new Set<string>(),
  orders: {},
  openOrders: [],
  matchedOrders: [],
  trades: {},
  lastUpdatedAt: Date.now(),
};

export const useExchangeStore = create<ExchangeState>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,
        
        setMarket: (market) => set((state) => {
          state.markets[market.marketId] = market;
          state.lastUpdatedAt = Date.now();
        }),
        
        updateMarket: (marketId, updates) => set((state) => {
          const market = state.markets[marketId];
          if (market) {
            Object.assign(market, updates);
            state.lastUpdatedAt = Date.now();
          }
        }),
        
        removeMarket: (marketId) => set((state) => {
          delete state.markets[marketId];
          state.subscribedMarkets.delete(marketId);
          state.lastUpdatedAt = Date.now();
        }),
        
        setWallet: (wallet) => set((state) => {
          state.wallet = wallet;
          state.lastUpdatedAt = Date.now();
        }),
        
        updateWallet: (updates) => set((state) => {
          if (state.wallet) {
            Object.assign(state.wallet, updates);
            state.lastUpdatedAt = Date.now();
          }
        }),
        
        setUser: (user) => set((state) => {
          state.user = user;
          state.lastUpdatedAt = Date.now();
        }),
        
        addOrder: (order) => set((state) => {
          state.orders[order.id] = order;
          
          if (order.status === "OPEN" || order.status === "PARTIALLY_MATCHED") {
            if (!state.openOrders.includes(order.id)) {
              state.openOrders.push(order.id);
            }
          } else if (order.status === "MATCHED") {
            if (!state.matchedOrders.includes(order.id)) {
              state.matchedOrders.push(order.id);
            }
            // Remove from open orders if present
            state.openOrders = state.openOrders.filter((id: string) => id !== order.id);
          }
          
          state.lastUpdatedAt = Date.now();
        }),
        
        updateOrder: (orderId, updates) => set((state) => {
          const order = state.orders[orderId];
          if (order) {
            Object.assign(order, updates);
            
            // Update order lists if status changed
            if (updates.status) {
              if (updates.status === "MATCHED") {
                if (!state.matchedOrders.includes(orderId)) {
                  state.matchedOrders.push(orderId);
                }
                state.openOrders = state.openOrders.filter(id => id !== orderId);
              } else if (updates.status === "OPEN" || updates.status === "PARTIALLY_MATCHED") {
                if (!state.openOrders.includes(orderId)) {
                  state.openOrders.push(orderId);
                }
                state.matchedOrders = state.matchedOrders.filter((id: string) => id !== orderId);
              }
            }
            
            state.lastUpdatedAt = Date.now();
          }
        }),
        
        removeOrder: (orderId) => set((state) => {
          delete state.orders[orderId];
          state.openOrders = state.openOrders.filter((id: string) => id !== orderId);
          state.matchedOrders = state.matchedOrders.filter((id: string) => id !== orderId);
          state.lastUpdatedAt = Date.now();
        }),
        
        addTrade: (trade) => set((state) => {
          state.trades[trade.id] = trade;
          state.lastUpdatedAt = Date.now();
        }),
        
        subscribeToMarket: (marketId) => set((state) => {
          state.subscribedMarkets.add(marketId);
          state.lastUpdatedAt = Date.now();
        }),
        
        unsubscribeFromMarket: (marketId) => set((state) => {
          state.subscribedMarkets.delete(marketId);
          state.lastUpdatedAt = Date.now();
        }),
        
        setSelectedMarket: (marketId) => set((state) => {
          state.selectedMarketId = marketId;
          state.lastUpdatedAt = Date.now();
        }),
        
        setSelectedRunner: (runnerId) => set((state) => {
          state.selectedRunnerId = runnerId;
          state.lastUpdatedAt = Date.now();
        }),
        
        clearStore: () => set(() => ({
          ...initialState,
          subscribedMarkets: new Set<string>(),
        })),
      }),
      {
        name: "exchange-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          wallet: state.wallet,
          selectedMarketId: state.selectedMarketId,
          selectedRunnerId: state.selectedRunnerId,
        }),
        version: 1,
      }
    )
  )
);

// Selector hooks for better performance
export const useMarket = (marketId?: string) => {
  return useExchangeStore((state) => (marketId ? state.markets[marketId] : undefined));
};

export const useWallet = () => {
  return useExchangeStore((state) => state.wallet);
};

export const useOpenOrders = () => {
  return useExchangeStore((state) => 
    state.openOrders.map(id => state.orders[id]).filter(Boolean)
  );
};

export const useMatchedOrders = () => {
  return useExchangeStore((state) => 
    state.matchedOrders.map(id => state.orders[id]).filter(Boolean)
  );
};

export const useSubscribedMarkets = () => {
  return useExchangeStore((state) => Array.from(state.subscribedMarkets));
};

export const useSelectedMarket = () => {
  return useExchangeStore((state) => 
    state.selectedMarketId ? state.markets[state.selectedMarketId] : undefined
  );
};

// Utility function to calculate exposure for a market
export const calculateMarketExposure = (marketId: string, userId: string) => {
  const state = useExchangeStore.getState();
  const orders = Object.values(state.orders).filter(
    order => order.marketId === marketId && order.userId === userId
  );
  
  return orders.reduce((total, order) => {
    if (order.side === "LAY") {
      return total + (order.price - 1) * order.remainingStake;
    }
    return total + order.remainingStake;
  }, 0);
};
