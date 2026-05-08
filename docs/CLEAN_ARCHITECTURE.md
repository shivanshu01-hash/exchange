# Clean Architecture & Separation of Concerns

This document outlines the clean architecture and separation of concerns implemented in the cricket trading platform.

## Overview

The project follows a clear separation between:
- **Presentation Layer**: React components, pages, UI
- **Business Logic Layer**: Hooks, services, state management
- **Data Access Layer**: API clients, WebSocket clients, caching
- **Infrastructure Layer**: Utilities, configuration, types

## Folder Structure

### `/apps/web/app/` - Next.js App Router Pages
- Page components using React Server Components where possible
- Route handlers and API routes
- Uses `lib/` for client-side utilities

### `/apps/web/components/` - Reusable UI Components
- Presentational components (dumb components)
- Composite components
- Chart components for data visualization
- Organized by feature/domain

### `/apps/web/lib/` - App Router Utilities
- Client-side utilities specific to Next.js App Router
- Used by pages in `app/` directory
- Includes: `api-client.ts`, `cache.ts`, `optimizedSocket.ts`, `utils.ts`

### `/apps/web/src/` - Shared Business Logic
- **`/src/hooks/`**: Custom React hooks for business logic
- **`/src/services/`**: Service classes for API, WebSocket, caching
- **`/src/store/`**: Global state management (Zustand)
- **`/src/utils/`**: Pure utility functions
- **`/src/types/`**: TypeScript type definitions
- **`/src/config/`**: Configuration management
- **`/src/constants/`**: Application constants
- **`/src/shared/`**: Shared UI components library

## Separation Principles

### 1. Hooks (`/src/hooks/`)
- Encapsulate React state and side effects
- Reusable across components
- Examples:
  - `useMarket()`: Market data fetching and subscription
  - `useOrders()`: Order management
  - `useWallet()`: Wallet balance and transactions

### 2. Services (`/src/services/`)
- Business logic and data operations
- Stateless service classes
- Examples:
  - `ApiClient`: HTTP requests with retry, timeout, auth
  - `OptimizedSocketClient`: WebSocket connection management
  - Cache services with stale-while-revalidate pattern

### 3. Store (`/src/store/`)
- Global application state
- Zustand with persistence
- Selectors for derived state
- Examples:
  - `exchange.ts`: Market, orders, user, wallet state

### 4. Utilities (`/src/utils/`)
- Pure functions with no side effects
- Formatting, calculations, validations
- Examples:
  - `formatCurrency()`, `formatOdds()`
  - `calculateLiability()`, `calculateProfit()`
  - `debounce()`, `throttle()`

### 5. Types (`/src/types/` and `@exchange/shared`)
- TypeScript interfaces and types
- Shared types in monorepo package
- Examples:
  - `MarketSnapshot`, `OrderDto`, `TradeDto`
  - API response types, WebSocket message types

## Dependency Flow

```
Components → Hooks → Services → API/WebSocket → Backend
     ↓          ↓         ↓
   State      Logic     Data
     ↓          ↓         ↓
   Store     Utils     Cache
```

## Key Architectural Patterns

### 1. Repository Pattern (Backend)
- `BaseRepository` abstract class
- Domain-specific repositories (`MarketRepository`, `OrderRepository`)
- Separation of data access from business logic

### 2. Service Layer Pattern
- Business logic in service classes
- Uses repositories for data access
- Transaction management, validation, business rules

### 3. CQRS Pattern (Command Query Responsibility Segregation)
- Separate models for reading (queries) and writing (commands)
- Optimized read models for trading views
- Event sourcing for audit trail

### 4. Observer Pattern
- WebSocket pub/sub for real-time updates
- Market data streaming
- Order matching notifications

### 5. Strategy Pattern
- Multiple caching strategies (memory, Redis, SWR)
- Different matching algorithms
- Multiple authentication providers

## Code Organization Rules

### Do:
- Keep components focused on presentation only
- Extract business logic to hooks or services
- Use TypeScript interfaces for all props and parameters
- Follow single responsibility principle
- Use dependency injection for testability

### Don't:
- Put API calls directly in components
- Mix UI logic with business logic
- Duplicate code across hooks/services
- Use global variables for state

## Example: Adding a New Feature

1. **Define Types** (`packages/shared/src/index.ts`)
   ```typescript
   export interface NewFeatureData {
     id: string;
     // ... fields
   }
   ```

2. **Create Service** (`apps/web/src/services/newFeatureService.ts`)
   ```typescript
   export class NewFeatureService {
     async getData(): Promise<NewFeatureData> {
       // Business logic
     }
   }
   ```

3. **Create Hook** (`apps/web/src/hooks/useNewFeature.ts`)
   ```typescript
   export function useNewFeature() {
     const [data, setData] = useState<NewFeatureData>();
     
     useEffect(() => {
       const service = new NewFeatureService();
       service.getData().then(setData);
     }, []);
     
     return { data };
   }
   ```

4. **Create Component** (`apps/web/components/NewFeature.tsx`)
   ```typescript
   export function NewFeature() {
     const { data } = useNewFeature();
     
     return <div>{/* Render data */}</div>;
   }
   ```

5. **Add to Store** (if global state needed)
   ```typescript
   // In exchange store
   newFeature: NewFeatureData | null;
   setNewFeature: (data: NewFeatureData) => void;
   ```

## Testing Strategy

### Unit Tests
- Services: Mock dependencies, test business logic
- Hooks: Use React Testing Library
- Utils: Pure function testing

### Integration Tests
- API endpoints
- WebSocket connections
- Database operations

### E2E Tests
- User workflows
- Trading scenarios
- Performance under load

## Performance Considerations

### 1. Bundle Size
- Code splitting with dynamic imports
- Tree shaking enabled
- Lazy loading for charts and heavy components

### 2. Rendering Optimization
- React.memo for expensive components
- useMemo/useCallback for expensive computations
- Virtualized lists for large datasets

### 3. Network Optimization
- HTTP/2 for API calls
- WebSocket for real-time data
- Client-side caching with SWR pattern

### 4. Memory Management
- Cleanup event listeners
- Limit cache size
- Garbage collection awareness

## Security Considerations

### 1. Input Validation
- Zod schemas for all inputs
- Sanitization of user data
- Type-safe API boundaries

### 2. Authentication & Authorization
- JWT tokens with short expiry
- Role-based access control
- Secure token storage

### 3. Data Protection
- Encryption at rest and in transit
- Secure environment variables
- Audit logging

## Monitoring & Observability

### 1. Logging
- Structured logging with context
- Error tracking with stack traces
- Performance metrics

### 2. Metrics
- API response times
- WebSocket connection stability
- Cache hit rates

### 3. Alerting
- Error rate thresholds
- Performance degradation
- Security incidents

## Conclusion

This clean architecture provides:
- **Maintainability**: Clear separation of concerns
- **Testability**: Isolated units with mocked dependencies
- **Scalability**: Horizontal scaling of services
- **Performance**: Optimized rendering and data flow
- **Security**: Defense in depth with validation at each layer

The architecture evolves with the project, ensuring the platform remains robust, performant, and easy to maintain as it grows.