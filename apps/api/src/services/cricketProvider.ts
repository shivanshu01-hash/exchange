import { env } from "../config/env.js";
import { redis } from "../db/redis.js";

type CricketCacheOptions = { ttlSeconds?: number };

const baseUrl = `https://${env.RAPIDAPI_CRICBUZZ_HOST}`;

export async function fetchCricketProvider(path: string, options: CricketCacheOptions = {}) {
  if (!env.RAPIDAPI_KEY) {
    throw Object.assign(new Error("RAPIDAPI_KEY is not configured"), { status: 503 });
  }

  const cacheKey = `provider:cricbuzz:${path}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "x-rapidapi-host": env.RAPIDAPI_CRICBUZZ_HOST,
      "x-rapidapi-key": env.RAPIDAPI_KEY
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw Object.assign(new Error(`Cricket provider failed: ${response.status} ${body.slice(0, 200)}`), { status: response.status });
  }

  const payload = await response.json();
  await redis.set(cacheKey, JSON.stringify(payload), "EX", options.ttlSeconds ?? 10);
  return payload;
}

export const cricketProvider = {
  liveMatches: () => fetchCricketProvider("/matches/v1/live", { ttlSeconds: 8 }),
  recentMatches: () => fetchCricketProvider("/matches/v1/recent", { ttlSeconds: 30 }),
  upcomingMatches: () => fetchCricketProvider("/matches/v1/upcoming", { ttlSeconds: 60 }),
  matchInfo: (matchId: string) => fetchCricketProvider(`/mcenter/v1/${encodeURIComponent(matchId)}`, { ttlSeconds: 10 }),
  scorecard: (matchId: string) => fetchCricketProvider(`/mcenter/v1/${encodeURIComponent(matchId)}/scard`, { ttlSeconds: 10 }),
  commentary: (matchId: string) => fetchCricketProvider(`/mcenter/v1/${encodeURIComponent(matchId)}/comm`, { ttlSeconds: 5 }),
  overs: (matchId: string) => fetchCricketProvider(`/mcenter/v1/${encodeURIComponent(matchId)}/overs`, { ttlSeconds: 5 }),
  player: (playerId: string) => fetchCricketProvider(`/stats/v1/player/${encodeURIComponent(playerId)}`, { ttlSeconds: 3600 }),
  playerBatting: (playerId: string) => fetchCricketProvider(`/stats/v1/player/${encodeURIComponent(playerId)}/batting`, { ttlSeconds: 3600 }),
  playerBowling: (playerId: string) => fetchCricketProvider(`/stats/v1/player/${encodeURIComponent(playerId)}/bowling`, { ttlSeconds: 3600 }),
  series: (seriesId: string) => fetchCricketProvider(`/series/v1/${encodeURIComponent(seriesId)}`, { ttlSeconds: 300 }),
  seriesMatches: (seriesId: string) => fetchCricketProvider(`/series/v1/${encodeURIComponent(seriesId)}`, { ttlSeconds: 60 }),
  seriesSquads: (seriesId: string) => fetchCricketProvider(`/series/v1/${encodeURIComponent(seriesId)}/squads`, { ttlSeconds: 3600 }),
  seriesPointsTable: (seriesId: string) => fetchCricketProvider(`/stats/v1/series/${encodeURIComponent(seriesId)}/points-table`, { ttlSeconds: 300 })
};
