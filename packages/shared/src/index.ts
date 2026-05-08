export type Side = "BACK" | "LAY";
export type OrderStatus = "OPEN" | "PARTIALLY_MATCHED" | "MATCHED" | "CANCELLED" | "REJECTED";
export type MarketStatus = "OPEN" | "SUSPENDED" | "CLOSED" | "SETTLED";
export type RunnerStatus = "ACTIVE" | "REMOVED" | "WINNER" | "LOSER";
export type MarketType = "MATCH_ODDS" | "TOP_BATSMAN" | "TOP_BOWLER" | "TOTAL_RUNS" | "METHOD_OF_DISMISSAL" | "POWERPLAY_RUNS" | "SESSION_RUNS" | "COIN_TOSS";

export interface PriceLevel {
  price: number;
  size: number;
}

export interface RunnerPrice {
  selectionId: string;
  selectionName?: string;
  back: PriceLevel[];
  lay: PriceLevel[];
  lastTradedPrice?: number;
  matchedVolume: number;
  status: RunnerStatus;
}

export interface MarketSnapshot {
  marketId: string;
  eventId: string;
  eventName: string;
  marketName: string;
  marketType: MarketType;
  status: MarketStatus;
  startTime: string;
  runners: RunnerPrice[];
  version: number;
  updatedAt: string;
  totalMatched: number;
  inPlay: boolean;
  metadata?: Record<string, any>;
}

export interface PlaceOrderInput {
  marketId: string;
  selectionId: string;
  side: Side;
  price: number;
  stake: number;
  clientOrderId?: string;
  orderType?: "LIMIT" | "MARKET" | "STOP_LOSS" | "TAKE_PROFIT";
}

export interface OrderDto extends PlaceOrderInput {
  id: string;
  userId: string;
  remainingStake: number;
  matchedStake: number;
  averageMatchedPrice?: number;
  status: OrderStatus;
  liability: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  matchedAt?: string;
}

export interface TradeDto {
  id: string;
  marketId: string;
  selectionId: string;
  price: number;
  stake: number;
  backOrderId: string;
  layOrderId: string;
  backUserId: string;
  layUserId: string;
  commission: number;
  createdAt: string;
}

export interface BalanceDto {
  available: number;
  exposure: number;
  balance: number;
  pnl: number;
  currency: string;
}

export interface UserDto {
  id: string;
  email: string;
  username?: string;
  role: "USER" | "ADMIN" | "BROKER";
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  createdAt: string;
  lastLoginAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface SocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  sequence?: number;
}

// Cricket-specific types
export interface CricketMatch {
  id: string;
  seriesId: string;
  seriesName: string;
  team1: CricketTeam;
  team2: CricketTeam;
  matchType: "TEST" | "ODI" | "T20" | "T10";
  venue: string;
  startTime: string;
  status: "UPCOMING" | "LIVE" | "COMPLETED" | "ABANDONED";
  currentScore?: CricketScore;
  toss?: CricketToss;
  players?: CricketPlayer[];
}

export interface CricketTeam {
  id: string;
  name: string;
  shortName: string;
  flagUrl?: string;
}

export interface CricketScore {
  battingTeamId: string;
  runs: number;
  wickets: number;
  overs: number;
  runRate: number;
  requiredRunRate?: number;
  target?: number;
  innings: number;
}

export interface CricketToss {
  winnerTeamId: string;
  decision: "BAT" | "BOWL";
}

export interface CricketPlayer {
  id: string;
  name: string;
  role: "BATTER" | "BOWLER" | "ALL_ROUNDER" | "WICKETKEEPER";
  battingAverage?: number;
  bowlingAverage?: number;
  strikeRate?: number;
  economyRate?: number;
}

// Validation schemas (Zod) - will be used by both frontend and backend
export const validationSchemas = {
  // These are type definitions; actual Zod schemas would be implemented
  // in a separate file or with conditional imports
} as const;

// Utility types
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type Nullable<T> = T | null | undefined;
