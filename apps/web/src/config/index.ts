/**
 * Frontend configuration
 * Environment variables and runtime configuration
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000'),
  RETRY_ATTEMPTS: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || '1000'),
} as const;

// WebSocket Configuration
export const SOCKET_CONFIG = {
  URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  RECONNECT_INTERVAL: parseInt(process.env.NEXT_PUBLIC_WS_RECONNECT_INTERVAL || '5000'),
  MAX_RECONNECT_ATTEMPTS: parseInt(process.env.NEXT_PUBLIC_WS_MAX_RECONNECT_ATTEMPTS || '10'),
  PING_INTERVAL: parseInt(process.env.NEXT_PUBLIC_WS_PING_INTERVAL || '30000'),
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: parseInt(process.env.NEXT_PUBLIC_CACHE_TTL || '300000'), // 5 minutes
  MAX_ITEMS: parseInt(process.env.NEXT_PUBLIC_CACHE_MAX_ITEMS || '100'),
  STALE_WHILE_REVALIDATE: parseInt(process.env.NEXT_PUBLIC_CACHE_SWR || '60000'), // 1 minute
} as const;

// Trading Configuration
export const TRADING_CONFIG = {
  MIN_STAKE: parseFloat(process.env.NEXT_PUBLIC_MIN_STAKE || '1'),
  MAX_STAKE: parseFloat(process.env.NEXT_PUBLIC_MAX_STAKE || '10000'),
  DEFAULT_STAKE: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_STAKE || '10'),
  MIN_ODDS: parseFloat(process.env.NEXT_PUBLIC_MIN_ODDS || '1.01'),
  MAX_ODDS: parseFloat(process.env.NEXT_PUBLIC_MAX_ODDS || '1000'),
  COMMISSION_RATE: parseFloat(process.env.NEXT_PUBLIC_COMMISSION_RATE || '0.05'), // 5%
} as const;

// UI Configuration
export const UI_CONFIG = {
  THEME: {
    DEFAULT: process.env.NEXT_PUBLIC_THEME || 'light',
    SUPPORTED: ['light', 'dark', 'system'] as const,
  },
  ODDS_FORMAT: {
    DEFAULT: process.env.NEXT_PUBLIC_ODDS_FORMAT || 'decimal',
    SUPPORTED: ['decimal', 'fractional', 'american'] as const,
  },
  REFRESH_INTERVAL: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '30000'), // 30 seconds
  ANIMATION_DURATION: parseInt(process.env.NEXT_PUBLIC_ANIMATION_DURATION || '300'),
  NOTIFICATION_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_NOTIFICATION_TIMEOUT || '5000'),
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_CASHOUT: process.env.NEXT_PUBLIC_ENABLE_CASHOUT === 'true',
  ENABLE_INPLAY: process.env.NEXT_PUBLIC_ENABLE_INPLAY === 'true',
  ENABLE_MULTI_MARKET: process.env.NEXT_PUBLIC_ENABLE_MULTI_MARKET === 'true',
  ENABLE_ADVANCED_CHARTS: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_CHARTS === 'true',
  ENABLE_SOCIAL_TRADING: process.env.NEXT_PUBLIC_ENABLE_SOCIAL_TRADING === 'true',
} as const;

// Validation Constants
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// Export all configs
export const CONFIG = {
  API: API_CONFIG,
  SOCKET: SOCKET_CONFIG,
  CACHE: CACHE_CONFIG,
  TRADING: TRADING_CONFIG,
  UI: UI_CONFIG,
  FEATURES: FEATURE_FLAGS,
  VALIDATION: VALIDATION,
} as const;

export default CONFIG;