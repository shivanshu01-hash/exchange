# Odds Exchange Platform

Original full-stack sports exchange scaffold with BACK/LAY order matching, Redis-backed market/order caches, MongoDB ledgers, JWT auth, Socket.IO streaming, cashout, settlement, and a dark trading-style Next.js frontend.

Do not commit real provider keys, demo credentials, or production secrets. Configure secrets through `.env` based on `.env.example`.

## Run Locally

1. `cp .env.example .env`
2. `docker compose up -d mongo redis`
3. `npm install`
4. `npm run dev`

## Cricket API Setup

The app supports RapidAPI Cricbuzz-style cricket feeds through backend routes under `/api/cricket/*`.

Set these in `.env`:

```env
RAPIDAPI_KEY=your-full-rapidapi-key
RAPIDAPI_CRICBUZZ_HOST=cricbuzz-cricket.p.rapidapi.com
```

Never commit the real key. `.env` is ignored by git.

Supported app data:

- Live cricket data: `/api/cricket/live`
- Live scores: `/api/cricket/matches/:matchId/scorecard`
- Commentary: `/api/cricket/matches/:matchId/commentary`
- IPL/series data: `/api/cricket/series/:seriesId`
- Player stats: `/api/cricket/players/:playerId`, `/batting`, `/bowling`
- Ball-by-ball: `/api/cricket/matches/:matchId/ball-by-ball`
- Odds: `/api/cricket/odds` from the exchange market odds cache

## Documentation

See `docs/ARCHITECTURE.md` for folder structure, backend architecture, schemas, Redis design, matching engine flow, WebSocket flow, API routes, deployment, Docker, and scaling recommendations.
