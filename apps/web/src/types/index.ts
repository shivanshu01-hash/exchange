/**
 * Frontend-specific TypeScript types
 * Extends shared types from @exchange/shared
 */

export * from '@exchange/shared';

// Frontend-specific extensions
export interface UIState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  marketId?: string;
  status?: string[];
  side?: 'BACK' | 'LAY';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface MarketChartData {
  marketId: string;
  selectionId: string;
  data: ChartDataPoint[];
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  oddsFormat: 'decimal' | 'fractional' | 'american';
  defaultStake: number;
  soundEnabled: boolean;
  notifications: {
    matchedBets: boolean;
    priceMovements: boolean;
    marketUpdates: boolean;
  };
  autoRefresh: boolean;
  refreshInterval: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}