/**
 * Application constants
 * Static values used throughout the application
 */

// Trading Constants
export const TRADING_CONSTANTS = {
  SIDES: {
    BACK: 'BACK' as const,
    LAY: 'LAY' as const,
  },
  ORDER_STATUS: {
    PENDING: 'PENDING',
    MATCHED: 'MATCHED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    FAILED: 'FAILED',
  },
  ORDER_TYPES: {
    LIMIT: 'LIMIT',
    MARKET: 'MARKET',
    STOP: 'STOP',
  },
  MARKET_STATUS: {
    OPEN: 'OPEN',
    SUSPENDED: 'SUSPENDED',
    CLOSED: 'CLOSED',
    SETTLED: 'SETTLED',
  },
  BET_TYPES: {
    SINGLE: 'SINGLE',
    MULTIPLE: 'MULTIPLE',
    SYSTEM: 'SYSTEM',
  },
} as const;

// UI Constants
export const UI_CONSTANTS = {
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  COLORS: {
    BACK: {
      light: '#dcfce7',
      DEFAULT: '#22c55e',
      dark: '#15803d',
    },
    LAY: {
      light: '#fee2e2',
      DEFAULT: '#ef4444',
      dark: '#b91c1c',
    },
    NEUTRAL: {
      light: '#f3f4f6',
      DEFAULT: '#6b7280',
      dark: '#374151',
    },
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
  },
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    TIMING: {
      EASE: 'cubic-bezier(0.4, 0, 0.2, 1)',
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
  },
} as const;

// API Constants
export const API_CONSTANTS = {
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      PROFILE: '/api/auth/profile',
    },
    MARKETS: {
      LIST: '/api/markets',
      DETAIL: '/api/markets/:id',
      SNAPSHOT: '/api/markets/:id/snapshot',
      HISTORY: '/api/markets/:id/history',
    },
    ORDERS: {
      LIST: '/api/orders',
      PLACE: '/api/orders',
      CANCEL: '/api/orders/:id/cancel',
      HISTORY: '/api/orders/history',
    },
    WALLET: {
      BALANCE: '/api/wallet/balance',
      DEPOSIT: '/api/wallet/deposit',
      WITHDRAW: '/api/wallet/withdraw',
      TRANSACTIONS: '/api/wallet/transactions',
    },
    CRICKET: {
      LIVE: '/api/cricket/live',
      MATCHES: '/api/cricket/matches',
      SCORE: '/api/cricket/match/:id',
    },
  },
  ERROR_CODES: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    RATE_LIMIT: 429,
    SERVER_ERROR: 500,
  },
  HEADERS: {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    X_API_KEY: 'X-API-Key',
    X_REQUEST_ID: 'X-Request-ID',
  },
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  CONNECTION: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    RECONNECT: 'reconnect',
    RECONNECT_ATTEMPT: 'reconnect_attempt',
    RECONNECT_ERROR: 'reconnect_error',
    RECONNECT_FAILED: 'reconnect_failed',
  },
  MARKET: {
    SUBSCRIBE: 'market:subscribe',
    UNSUBSCRIBE: 'market:unsubscribe',
    UPDATE: 'market:update',
    SNAPSHOT: 'market:snapshot',
    TRADE: 'market:trade',
  },
  ORDER: {
    PLACED: 'order:placed',
    MATCHED: 'order:matched',
    CANCELLED: 'order:cancelled',
    UPDATED: 'order:updated',
  },
  USER: {
    BALANCE_UPDATE: 'user:balance:update',
    NOTIFICATION: 'user:notification',
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH: {
    TOKEN: 'auth_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    USER: 'auth_user',
  },
  PREFERENCES: {
    THEME: 'preferences_theme',
    ODDS_FORMAT: 'preferences_odds_format',
    LANGUAGE: 'preferences_language',
    SOUND: 'preferences_sound',
    NOTIFICATIONS: 'preferences_notifications',
  },
  CACHE: {
    MARKETS: 'cache_markets',
    ORDERS: 'cache_orders',
    WALLET: 'cache_wallet',
  },
  SESSION: {
    LAST_ACTIVE: 'session_last_active',
    REDIRECT_URL: 'session_redirect_url',
  },
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: {
    DATE: 'dd MMM yyyy',
    TIME: 'HH:mm',
    DATETIME: 'dd MMM yyyy, HH:mm',
    RELATIVE: 'relative',
  },
  API: {
    DATE: 'yyyy-MM-dd',
    DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  },
  CHART: {
    DAY: 'HH:mm',
    WEEK: 'EEE',
    MONTH: 'dd MMM',
    YEAR: 'MMM yyyy',
  },
} as const;

// Export all constants
export const CONSTANTS = {
  TRADING: TRADING_CONSTANTS,
  UI: UI_CONSTANTS,
  API: API_CONSTANTS,
  SOCKET: SOCKET_EVENTS,
  STORAGE: STORAGE_KEYS,
  DATE: DATE_FORMATS,
} as const;

export default CONSTANTS;