# Project Folder Structure

This document outlines the improved folder structure for the cricket trading platform.

## Overview

The project follows a monorepo structure with clear separation of concerns:

```
exchange/
├── apps/
│   ├── api/                    # Backend API server
│   └── web/                    # Frontend Next.js application
├── packages/
│   └── shared/                 # Shared TypeScript types and utilities
└── docs/                       # Documentation
```

## Backend Structure (`apps/api/`)

```
src/
├── config/                     # Configuration files
│   ├── env.ts                 # Environment variables
│   └── constants.ts           # Application constants
│
├── db/                        # Database connections
│   ├── mongo.ts              # MongoDB connection
│   └── redis.ts              # Redis connection
│
├── middleware/                # Express middleware
│   ├── auth.ts               # Authentication middleware
│   ├── error.ts              # Error handling middleware
│   ├── validate.ts           # Request validation
│   └── rateLimit.ts          # Rate limiting
│
├── models/                    # Database models (Mongoose schemas)
│   ├── User.ts
│   ├── Wallet.ts
│   ├── Market.ts
│   ├── Order.ts
│   ├── Trade.ts
│   ├── Transaction.ts
│   └── BetHistory.ts
│
├── routes/                    # API routes
│   ├── index.ts              # Route aggregator
│   ├── auth.ts               # Authentication routes
│   ├── markets.ts            # Market data routes
│   ├── orders.ts             # Order management routes
│   ├── wallet.ts             # Wallet operations
│   ├── cricket.ts            # Cricket data routes
│   └── admin.ts              # Admin routes
│
├── services/                  # Business logic services
│   ├── matchingEngine.ts     # Order matching engine
│   ├── walletEngine.ts       # Wallet operations
│   ├── riskEngine.ts         # Risk management
│   ├── settlementEngine.ts   # Bet settlement
│   ├── cashoutEngine.ts      # Cashout logic
│   ├── cricketProvider.ts    # External cricket data
│   ├── marketCache.ts        # Market data caching
│   └── advancedCache.ts      # Advanced caching system
│
├── socket/                    # WebSocket server
│   ├── socketServer.ts       # Legacy socket server
│   └── optimizedSocketServer.ts # Enhanced socket server
│
├── stream/                    # External data streams
│   └── betfairStreamClient.ts # Betfair stream integration
│
├── utils/                     # Utility functions
│   ├── money.ts              # Financial calculations
│   ├── validation.ts         # Data validation
│   └── logger.ts             # Logging utilities
│
├── types/                     # TypeScript type definitions
│   ├── index.ts
│   └── socket.ts
│
├── app.ts                     # Express application setup
└── server.ts                  # Server entry point
```

## Frontend Structure (`apps/web/`)

```
app/                           # Next.js 15 App Router
├── (auth)/                    # Authentication group
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── (dashboard)/               # Dashboard group
│   ├── layout.tsx
│   ├── page.tsx              # Main dashboard
│   ├── markets/              # Market listings
│   │   └── [marketId]/
│   │       └── page.tsx
│   ├── in-play/              # In-play markets
│   │   └── page.tsx
│   ├── open-bets/            # Open bets
│   │   └── page.tsx
│   ├── matched-bets/         # Matched bets
│   │   └── page.tsx
│   ├── profit-loss/          # P&L reports
│   │   └── page.tsx
│   └── wallet/               # Wallet management
│       └── page.tsx
│
├── (cricket)/                 # Cricket data group
│   ├── live/                 # Live matches
│   │   └── page.tsx
│   └── match/                # Match details
│       └── [matchId]/
│           └── page.tsx
│
├── (admin)/                   # Admin panel group
│   └── page.tsx
│
├── api/                       # API routes (server actions)
│   ├── auth/
│   ├── markets/
│   └── orders/
│
├── components/                # App-specific components
│   └── layout/               # Layout components
│
├── globals.css               # Global styles
├── layout.tsx                # Root layout
└── page.tsx                  # Home page

components/                    # Reusable UI components
├── ui/                       # Primitive components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Table.tsx
│   ├── Tooltip.tsx
│   └── index.ts             # Barrel export
│
├── layout/                   # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
│
├── trading/                  # Trading-specific components
│   ├── OddsLadder.tsx
│   ├── OddsLadderOptimized.tsx
│   ├── BetPanel.tsx
│   ├── MarketCard.tsx
│   └── OrderTicket.tsx
│
├── data/                     # Data display components
│   ├── MarketTable.tsx
│   ├── OrdersTable.tsx
│   └── TradesTable.tsx
│
├── feedback/                 # Feedback components
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   ├── Toast.tsx
│   └── Skeleton.tsx
│
└── charts/                   # Charting components
    ├── PriceChart.tsx
    └── VolumeChart.tsx

lib/                          # Library code
├── api/                      # API clients
│   ├── client.ts            # Main API client
│   ├── socket.ts            # Socket client
│   └── optimizedSocket.ts   # Enhanced socket client
│
├── hooks/                    # Custom React hooks
│   ├── useMarket.ts
│   ├── useOrders.ts
│   ├── useSocket.ts
│   └── useAuth.ts
│
├── store/                    # State management
│   └── exchangeStore.ts     # Zustand store
│
├── utils/                    # Utility functions
│   ├── index.ts             # Main utilities
│   ├── format.ts            # Formatting functions
│   ├── validation.ts        # Validation helpers
│   └── cache.ts             # Client-side caching
│
└── constants/                # Application constants
    ├── markets.ts
    └── trading.ts

public/                       # Static assets
├── images/
├── icons/
└── fonts/

types/                        # TypeScript type definitions
├── index.ts                  # Main type exports
├── api.ts                    # API types
└── trading.ts                # Trading-specific types
```

## Shared Package (`packages/shared/`)

```
src/
├── index.ts                  # Main exports
├── types/                    # Type definitions
│   ├── market.ts            # Market types
│   ├── order.ts             # Order types
│   ├── trade.ts             # Trade types
│   ├── user.ts              # User types
│   └── cricket.ts           # Cricket data types
│
├── constants/               # Shared constants
│   ├── markets.ts
│   └── trading.ts
│
└── utils/                   # Shared utilities
    ├── validation.ts
    └── format.ts
```

## Key Improvements

### 1. **Logical Grouping**
   - Routes grouped by feature (`(dashboard)`, `(auth)`, `(cricket)`)
   - Components organized by purpose (`ui/`, `trading/`, `data/`, `feedback/`)
   - Clear separation between app-specific and reusable components

### 2. **Type Safety**
   - Centralized type definitions in `types/` directories
   - Shared types package for consistency between frontend and backend
   - Barrel exports for easy imports

### 3. **Scalability**
   - Modular structure allows easy addition of new features
   - Clear separation of concerns
   - Reusable components and utilities

### 4. **Maintainability**
   - Consistent naming conventions
   - Logical file organization
   - Comprehensive documentation

### 5. **Performance**
   - Optimized component structure for code splitting
   - Efficient import paths
   - Clear separation of client and server code

## Migration Steps

1. **Phase 1: Create new structure**
   - Create new directories according to the improved structure
   - Move existing files to their new locations
   - Update import paths

2. **Phase 2: Update configurations**
   - Update TypeScript paths configuration
   - Update Next.js configuration
   - Update build scripts if needed

3. **Phase 3: Refactor components**
   - Convert to use new barrel exports
   - Update component imports
   - Add proper TypeScript types

4. **Phase 4: Testing**
   - Verify all imports work correctly
   - Test application functionality
   - Fix any broken paths or imports

## Naming Conventions

- **Files**: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- **Directories**: `kebab-case` for feature directories, `camelCase` for utility directories
- **Components**: `PascalCase` for component names
- **Hooks**: `useCamelCase` for custom hooks
- **Types**: `PascalCase` for interfaces and types

## Import Examples

```typescript
// Before
import { Button } from "@/components/ui/Button";
import { useMarket } from "@/hooks/useMarket";

// After (with barrel exports)
import { Button } from "@/components/ui";
import { useMarket } from "@/hooks";
```

This structure provides a solid foundation for scaling the application while maintaining code quality and developer productivity.