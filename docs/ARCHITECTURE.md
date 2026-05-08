# Sports Exchange Platform Architecture

## 1. Full Project Folder Structure

```text
odds-exchange-platform/
  apps/
    api/                 Node.js, Express, TypeScript, Socket.IO
      src/config         Environment validation
      src/db             MongoDB and Redis connections, locks, key map
      src/middleware     JWT auth, validation, rate limiting error flow
      src/models         MongoDB schemas
      src/routes         REST API gateway routes
      src/services       Wallet, matching, risk, cashout, settlement, market cache
      src/socket         Socket.IO server and Redis pub/sub bridge
      src/stream         Betfair TLS streaming client
      src/utils          Money, odds, liability helpers
    web/                 Next.js, React, Tailwind, Zustand, Socket.IO client
      app/               Login, dashboard, in-play, match, bets, wallet, P/L, admin
      components/        Shell, odds ladder, market cards, bet panel
      lib/               API and socket clients
      store/             Client-side market and wallet store
  packages/shared/       Shared order, market, wallet, trade types
  docker-compose.yml     MongoDB, Redis, API, Web
  .env.example           Environment contract without secrets
```

## 2. Complete Backend Architecture

Request path:

```text
Browser / Mobile
  -> Next.js frontend
  -> Express API gateway
  -> Auth / Wallet / Risk / Bet / Matching / Cashout / Settlement services
  -> MongoDB for durable state
  -> Redis for cache, order book, locks, pub/sub, sessions
  -> Betfair Stream API or external odds provider
```

Services:

- `Auth Service`: bcrypt password hashing, JWT issuance, API protection, WebSocket auth.
- `Wallet Service`: deposit, withdraw, exposure lock/release, transaction ledger, real-time wallet publishing.
- `Risk Engine`: user exposure cap, market exposure cap, duplicate order protection through `userId + clientOrderId` uniqueness.
- `Bet Engine`: validates market/runner status, odds range, stake, side, liability.
- `Matching Engine`: price-time priority, partial fills, full fills, cancellation, Redis-backed book index, MongoDB durable orders/trades.
- `Market Cache`: Redis snapshots for high-frequency odds reads.
- `Stream Client`: TLS socket, CRLF JSON parser, heartbeat monitor, reconnect loop.
- `Settlement Engine`: winner determination, P/L, commission, wallet updates, bet history.
- `Cashout Engine`: current odds vs entry odds, hedge-side calculation, auto hedge order.

## 3. Database Schemas

MongoDB collections:

- `users`: `email`, `passwordHash`, `role`, `status`, timestamps.
- `wallets`: `userId`, `balance`, `available`, `exposure`, `pnl`, timestamps.
- `transactions`: `userId`, `type`, `amount`, `balanceAfter`, refs, metadata, timestamps.
- `markets`: `marketId`, `eventName`, `marketName`, `status`, `startTime`, `runners`, `version`, timestamps.
- `orders`: `userId`, `marketId`, `selectionId`, `side`, `price`, `stake`, `remainingStake`, `matchedStake`, `averageMatchedPrice`, `liability`, `clientOrderId`, `status`, timestamps.
- `trades`: `marketId`, `selectionId`, `price`, `stake`, `backOrderId`, `layOrderId`, `backUserId`, `layUserId`, timestamps.
- `betHistories`: settled per-user trade outcome with gross P/L, commission, and net P/L.

Important indexes:

- `orders`: `{ userId: 1, clientOrderId: 1 }` unique for duplicate prevention.
- `orders`: `marketId`, `selectionId`, `status`, `side`, `price`, `createdAt` for matching queries.
- `trades`: `marketId`, `selectionId` for settlement and market activity.

## 4. Redis Architecture

Redis keys:

- `market:{marketId}`: latest market snapshot with back/lay ladders, runner status, LTP, volume.
- `ob:{marketId}:{selectionId}:back`: sorted-set order index, score favors highest price then earliest time.
- `ob:{marketId}:{selectionId}:lay`: sorted-set order index, score favors lowest price then earliest time.
- `order:{orderId}`: optional order cache for hot paths.
- `session:{userId}`: session cache and future token revocation metadata.
- `lock:{name}`: distributed locks for wallet and order-book critical sections.
- `odds:update`: pub/sub channel for market snapshots.
- `trade:update`: pub/sub channel for matched trades.
- `wallet:update`: pub/sub channel for wallet balance updates.

## 5. Matching Engine Logic

The matching engine is implemented in `apps/api/src/services/matchingEngine.ts`.

Flow:

```text
placeOrder
  -> validate market open and runner active
  -> normalize odds and stake
  -> calculate liability
  -> risk checks
  -> acquire book lock for market + selection
  -> create durable order
  -> lock wallet exposure
  -> find opposite-side orders crossing price
  -> sort by best price then oldest time
  -> create trades for full or partial fills
  -> update order remaining/matched status
  -> publish trade updates
  -> add residual quantity to Redis order book
```

Price priority:

- BACK incoming matches LAY orders where `lay.price <= back.price`, lowest lay first.
- LAY incoming matches BACK orders where `back.price >= lay.price`, highest back first.

Time priority:

- For equal price, older `createdAt` orders match first.

Concurrency:

- `withLock(book:{marketId}:{selectionId})` serializes matching for one runner book.
- `withLock(wallet:{userId})` serializes balance/exposure mutations.

## 6. WebSocket Flow

Implemented in `apps/api/src/socket/socketServer.ts` and `apps/web/lib/socket.ts`.

```text
Client connects with JWT in Socket.IO auth
  -> server validates JWT
  -> server joins user:{userId}
  -> client emits market:subscribe with marketId
  -> server joins market:{marketId}
  -> server sends cached market:snapshot
  -> Redis odds:update publishes market updates
  -> Socket.IO broadcasts market:update to market room
  -> Redis trade:update publishes fills
  -> Socket.IO broadcasts trade:update to market room
  -> Redis wallet:update publishes balances
  -> Socket.IO broadcasts wallet:update to user room
```

Reliability:

- Client uses infinite reconnect with bounded delay.
- Server uses Socket.IO ping interval and ping timeout.
- Client sends `heartbeat`; server replies with `heartbeat:ack`.

## 7. API Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`

Markets:

- `GET /api/markets`
- `GET /api/markets/:marketId`
- `POST /api/markets` admin only
- `POST /api/markets/:marketId/settle` admin only

Orders:

- `POST /api/orders`
- `GET /api/orders/open`
- `GET /api/orders/matched`
- `DELETE /api/orders/:orderId`
- `POST /api/orders/cashout/quote`
- `POST /api/orders/cashout/execute`

Wallet:

- `GET /api/wallet`
- `GET /api/wallet/transactions`
- `POST /api/wallet/deposit`
- `POST /api/wallet/withdraw`
- `GET /api/wallet/pnl`

Cricket data:

- `GET /api/cricket/live`
- `GET /api/cricket/recent`
- `GET /api/cricket/upcoming`
- `GET /api/cricket/matches/:matchId`
- `GET /api/cricket/matches/:matchId/scorecard`
- `GET /api/cricket/matches/:matchId/commentary`
- `GET /api/cricket/matches/:matchId/ball-by-ball`
- `GET /api/cricket/players/:playerId`
- `GET /api/cricket/players/:playerId/batting`
- `GET /api/cricket/players/:playerId/bowling`
- `GET /api/cricket/series/:seriesId`
- `GET /api/cricket/series/:seriesId/squads`
- `GET /api/cricket/series/:seriesId/points-table`
- `GET /api/cricket/odds`

The RapidAPI Cricbuzz key is read from `RAPIDAPI_KEY`. Odds are served from the exchange market cache because cricket score feeds typically do not carry betting odds.

Admin:

- `GET /api/admin/summary`

## 8. Frontend Pages

Implemented pages:

- `/login`: JWT login screen, dark original UI.
- `/dashboard`: market cards and trading overview.
- `/in-play`: in-play markets.
- `/matches/[marketId]`: live odds ladder, BACK/LAY ticket, cashout button.
- `/open-bets`: unmatched and partially matched bets.
- `/matched-bets`: matched order history view.
- `/wallet`: balance, available balance, exposure, P/L.
- `/profit-loss`: market-level P/L placeholder ready for API data.
- `/admin`: market suspension, settlement, and risk dashboard shell.

UI features:

- Dark responsive shell.
- Mobile horizontal navigation.
- Fast odds ladder layout.
- Flash-up and flash-down odds animation.
- Trading-style back/lay colors without copying any reference platform.

## 9. Example Code Locations

- Stream client: `apps/api/src/stream/betfairStreamClient.ts`
- Matching engine: `apps/api/src/services/matchingEngine.ts`
- Wallet engine: `apps/api/src/services/walletEngine.ts`
- WebSocket server: `apps/api/src/socket/socketServer.ts`

## 10. Deployment Guide

1. Provision MongoDB replica set and Redis with persistence.
2. Create production `.env` using `.env.example` as the contract.
3. Store secrets in a secret manager, not source control.
4. Build images with `docker compose build` or CI.
5. Run database migrations/index creation through application startup or a migration worker.
6. Deploy API behind an L7 load balancer with sticky WebSocket support or Socket.IO Redis adapter.
7. Deploy Web as static/Node Next.js service.
8. Enable TLS at the edge.
9. Configure logs, metrics, traces, and audit retention.

## 11. Docker Setup

Local dependencies:

```bash
docker compose up -d mongo redis
npm install
npm run dev
```

Full stack:

```bash
cp .env.example .env
docker compose up --build
```

## 12. Production Scaling Recommendations

- Run one matching-engine shard per sport/event/market partition to avoid cross-node book contention.
- Use Redis Cluster for market cache and pub/sub adapter or move high-volume events to NATS/Kafka.
- Use MongoDB replica set with write concern tuned for financial durability.
- Use append-only transaction ledger; never mutate history.
- Add idempotency keys for deposits, withdrawals, orders, cashout, and settlement.
- Run settlement as a separate worker with retry and dead-letter queue.
- Keep API nodes stateless; store sessions/token revocation in Redis.
- Add Socket.IO Redis adapter when running multiple API nodes.
- Add WAF, CDN, per-route rate limits, IP reputation, bot challenge, and account-level throttles.
- Use Prometheus metrics for match latency, queue depth, Redis latency, Mongo write latency, stream heartbeat age, and WebSocket fanout lag.
- Precompute exposure by market and user for active high-volume markets.
- Consider a Lua-scripted Redis matching path or dedicated in-memory matching service for ultra-low latency, with asynchronous durable event sourcing.
