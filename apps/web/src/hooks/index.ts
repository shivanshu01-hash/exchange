/**
 * Custom React hooks for the trading platform
 */

export { useMarket, useMarketList } from './useMarket';
export { useOrders, useOrder } from './useOrders';
export { useWallet } from './useWallet';

// Re-export utility hooks from React
export { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';

// Custom hook for authentication
export function useAuth() {
  // This would be implemented with actual auth logic
  return {
    isAuthenticated: false,
    user: null,
    login: () => {},
    logout: () => {},
    isLoading: false,
  };
}

// Custom hook for theme
export function useTheme() {
  // This would be implemented with actual theme logic
  return {
    theme: 'light',
    toggleTheme: () => {},
    isDark: false,
  };
}

// Custom hook for notifications
export function useNotifications() {
  return {
    notifications: [],
    unreadCount: 0,
    markAsRead: (id: string) => {},
    clearAll: () => {},
    addNotification: (notification: any) => {},
  };
}